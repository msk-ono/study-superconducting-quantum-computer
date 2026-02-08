use wasm_bindgen::prelude::*;

mod pauli;
mod stabilizer;
mod error;
mod codes;

use crate::stabilizer::StabilizerState;
use crate::error::{Error, ErrorType, Syndrome};
use crate::codes::{get_code_by_name, get_code_info, available_codes};

/// Initialize panic hook for better error messages in browser console
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// JavaScript-facing QEC simulator API
#[wasm_bindgen]
pub struct QECSimulator {
    state: StabilizerState,
    applied_errors: Vec<Error>,
}

#[wasm_bindgen]
impl QECSimulator {
    /// Create a new simulator with a specific code
    #[wasm_bindgen(constructor)]
    pub fn new(code_name: &str) -> Result<QECSimulator, JsValue> {
        let state = get_code_by_name(code_name)
            .ok_or_else(|| JsValue::from_str(&format!("Unknown code: {}", code_name)))?;
        
        Ok(QECSimulator {
            state,
            applied_errors: Vec::new(),
        })
    }

    /// Get number of qubits in the code
    #[wasm_bindgen(getter)]
    pub fn n_qubits(&self) -> usize {
        self.state.n_qubits()
    }

    /// Get stabilizers as JSON string
    #[wasm_bindgen(js_name = getStabilizers)]
    pub fn get_stabilizers(&self) -> String {
        let stabs: Vec<String> = self.state
            .get_all_stabilizers()
            .iter()
            .map(|s| s.to_string())
            .collect();
        serde_json::to_string(&stabs).unwrap()
    }

    /// Apply an error to a specific qubit
    /// Note: This will automatically clear any existing error on this qubit first
    #[wasm_bindgen(js_name = applyError)]
    pub fn apply_error(&mut self, qubit: usize, error_type: &str) -> Result<(), JsValue> {
        if qubit >= self.state.n_qubits() {
            return Err(JsValue::from_str("Qubit index out of bounds"));
        }

        // First, remove any existing error on this qubit
        self.applied_errors.retain(|e| e.qubit != qubit);
        
        // Reset state and reapply all remaining errors
        let code_name = self.get_code_name();
        self.state = get_code_by_name(&code_name)
            .ok_or_else(|| JsValue::from_str("Failed to reset state"))?;
        
        for error in &self.applied_errors {
            error.apply_to_state(&mut self.state);
        }

        // Now apply the new error
        let err_type = match error_type {
            "X" => ErrorType::X,
            "Y" => ErrorType::Y,
            "Z" => ErrorType::Z,
            _ => return Err(JsValue::from_str("Invalid error type")),
        };

        let error = Error::new(qubit, err_type);
        error.apply_to_state(&mut self.state);
        self.applied_errors.push(error);

        Ok(())
    }

    /// Get the current syndrome as JSON
    #[wasm_bindgen(js_name = getSyndrome)]
    pub fn get_syndrome(&self) -> String {
        let syndrome = Syndrome::from_state(&self.state);
        serde_json::to_string(&syndrome.outcomes).unwrap()
    }

    /// Check if there are any detected errors
    #[wasm_bindgen(js_name = hasError)]
    pub fn has_error(&self) -> bool {
        let syndrome = Syndrome::from_state(&self.state);
        syndrome.has_error()
    }

    /// Get indices of triggered stabilizers
    #[wasm_bindgen(js_name = getTriggeredStabilizers)]
    pub fn get_triggered_stabilizers(&self) -> Vec<usize> {
        let syndrome = Syndrome::from_state(&self.state);
        syndrome.triggered_stabilizers()
    }

    /// Reset the simulator to initial state
    #[wasm_bindgen]
    pub fn reset(&mut self, code_name: &str) -> Result<(), JsValue> {
        let state = get_code_by_name(code_name)
            .ok_or_else(|| JsValue::from_str(&format!("Unknown code: {}", code_name)))?;
        
        self.state = state;
        self.applied_errors.clear();
        Ok(())
    }

    /// Clear error from a specific qubit
    #[wasm_bindgen(js_name = clearQubitError)]
    pub fn clear_qubit_error(&mut self, qubit: usize) -> Result<(), JsValue> {
        // Remove all errors affecting this qubit
        self.applied_errors.retain(|e| e.qubit != qubit);
        
        // Reset state and reapply remaining errors
        let code_name = self.get_code_name();
        self.state = get_code_by_name(&code_name)
            .ok_or_else(|| JsValue::from_str("Failed to reset state"))?;
        
        // Reapply remaining errors
        for error in &self.applied_errors {
            error.apply_to_state(&mut self.state);
        }
        
        Ok(())
    }
    
    /// Helper to get current code name
    fn get_code_name(&self) -> String {
        // Infer code name from number of qubits and stabilizers
        let n_qubits = self.state.n_qubits();
        match n_qubits {
            3 => "repetition_3".to_string(),
            5 => "five_qubit".to_string(),
            7 => "steane".to_string(),
            9 => "surface_d3".to_string(),
            _ => "repetition_3".to_string(), // default
        }
    }

    /// Get applied errors as JSON
    #[wasm_bindgen(js_name = getAppliedErrors)]
    pub fn get_applied_errors(&self) -> String {
        serde_json::to_string(&self.applied_errors).unwrap()
    }
}

/// Get available codes (module-level function)
#[wasm_bindgen(js_name = getAvailableCodes)]
pub fn get_available_codes() -> String {
    serde_json::to_string(&available_codes()).unwrap()
}

/// Get information about a specific code (module-level function)
#[wasm_bindgen(js_name = getCodeInfo)]
pub fn get_code_info_js(code_name: &str) -> String {
    if let Some(info) = get_code_info(code_name) {
        serde_json::to_string(&info).unwrap()
    } else {
        "null".to_string()
    }
}
