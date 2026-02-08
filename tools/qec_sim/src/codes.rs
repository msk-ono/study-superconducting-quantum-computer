use crate::pauli::PauliString;
use crate::stabilizer::StabilizerState;
use serde::{Deserialize, Serialize};

/// Predefined quantum error correction codes

/// Create a 3-qubit bit-flip repetition code
/// Encodes 1 logical qubit into 3 physical qubits
/// Stabilizers: Z0Z1, Z1Z2
/// Logical operators: X0X1X2, Z0Z1Z2
pub fn repetition_code_3() -> StabilizerState {
    let stabilizers = vec![
        PauliString::from_str("ZZI").unwrap(),
        PauliString::from_str("IZZ").unwrap(),
    ];

    // Note: This is a distance-3 code, but only detects 1 bit flip
    // We initialize with 2 stabilizers for 3 qubits (encodes 1 logical qubit)
    let mut state = StabilizerState::new(3);
    state.set_stabilizer(0, &stabilizers[0]);
    state.set_stabilizer(1, &stabilizers[1]);

    state
}

/// Create a 5-qubit perfect code
/// Smallest code that can correct any single-qubit error
/// Stabilizers: XZZXI, IXZZX, XIXZZ, ZXIXZ
pub fn five_qubit_code() -> StabilizerState {
    let stabilizers = vec![
        PauliString::from_str("XZZXI").unwrap(),
        PauliString::from_str("IXZZX").unwrap(),
        PauliString::from_str("XIXZZ").unwrap(),
        PauliString::from_str("ZXIXZ").unwrap(),
    ];

    let mut state = StabilizerState::new(5);
    for (i, stab) in stabilizers.iter().enumerate() {
        state.set_stabilizer(i, stab);
    }

    state
}

/// Create a Steane code (7-qubit code)
/// Can correct any single-qubit error
/// Stabilizers are generators of the code space
pub fn steane_code() -> StabilizerState {
    let stabilizers = vec![
        PauliString::from_str("IIIXXXX").unwrap(),
        PauliString::from_str("IXXIIXX").unwrap(),
        PauliString::from_str("XIXIXIX").unwrap(),
        PauliString::from_str("IIIZZZZ").unwrap(),
        PauliString::from_str("IZZIIZZ").unwrap(),
        PauliString::from_str("ZIZIZIZ").unwrap(),
    ];

    let mut state = StabilizerState::new(7);
    for (i, stab) in stabilizers.iter().enumerate() {
        state.set_stabilizer(i, stab);
    }

    state
}

/// Create a distance-3 surface code (9 qubits)
/// Arranged in a 3x3 grid:
///  0 - 1 - 2
///  |   |   |
///  3 - 4 - 5
///  |   |   |
///  6 - 7 - 8
///
/// 4 X-type stabilizers (on faces) and 4 Z-type stabilizers (on vertices)
pub fn surface_code_d3() -> StabilizerState {
    // X stabilizers (plaquettes)
    let stabilizers = vec![
        PauliString::from_str("XXIIIIIII").unwrap(), // 0-1
        PauliString::from_str("IXIIXIIII").unwrap(), // 1-2-4
        PauliString::from_str("IIIXXXXII").unwrap(), // 3-4-6-7
        PauliString::from_str("IIIIIIXIX").unwrap(), // 5-7-8
        // Z stabilizers (vertices)
        PauliString::from_str("ZIIZIIIII").unwrap(), // 0-3
        PauliString::from_str("IZIZIZIII").unwrap(), // 1-3-4-6
        PauliString::from_str("IIZIIIZIZ").unwrap(), // 2-4-5-7
        PauliString::from_str("IIIIIIZZI").unwrap(), // 5-8
    ];

    let mut state = StabilizerState::new(9);
    for (i, stab) in stabilizers.iter().enumerate() {
        state.set_stabilizer(i, stab);
    }

    state
}

/// Get a code by name
pub fn get_code_by_name(name: &str) -> Option<StabilizerState> {
    match name {
        "repetition_3" => Some(repetition_code_3()),
        "five_qubit" => Some(five_qubit_code()),
        "steane" => Some(steane_code()),
        "surface_d3" => Some(surface_code_d3()),
        _ => None,
    }
}

/// Get metadata about a code
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeInfo {
    pub name: String,
    pub description: String,
    pub n_qubits: usize,
    pub n_logical: usize,
    pub distance: usize,
}

pub fn get_code_info(name: &str) -> Option<CodeInfo> {
    match name {
        "repetition_3" => Some(CodeInfo {
            name: "3-qubit Repetition Code".to_string(),
            description: "Bit-flip code, detects 1 X error".to_string(),
            n_qubits: 3,
            n_logical: 1,
            distance: 3,
        }),
        "five_qubit" => Some(CodeInfo {
            name: "5-qubit Perfect Code".to_string(),
            description: "Smallest code correcting any single-qubit error".to_string(),
            n_qubits: 5,
            n_logical: 1,
            distance: 3,
        }),
        "steane" => Some(CodeInfo {
            name: "Steane Code".to_string(),
            description: "7-qubit CSS code, corrects any single error".to_string(),
            n_qubits: 7,
            n_logical: 1,
            distance: 3,
        }),
        "surface_d3" => Some(CodeInfo {
            name: "Surface Code (d=3)".to_string(),
            description: "9-qubit surface code on 3x3 grid".to_string(),
            n_qubits: 9,
            n_logical: 1,
            distance: 3,
        }),
        _ => None,
    }
}

pub fn available_codes() -> Vec<&'static str> {
    vec!["repetition_3", "five_qubit", "steane", "surface_d3"]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_repetition_code() {
        let state = repetition_code_3();
        let stabs = state.get_all_stabilizers();

        assert_eq!(stabs.len(), 3);
        assert_eq!(stabs[0].to_string(), "ZZI");
        assert_eq!(stabs[1].to_string(), "IZZ");
    }

    #[test]
    fn test_five_qubit_code() {
        let state = five_qubit_code();
        let stabs = state.get_all_stabilizers();

        assert_eq!(stabs.len(), 5);
        // Verify stabilizers commute
        for i in 0..stabs.len() {
            for j in 0..stabs.len() {
                assert!(stabs[i].commutes_with(&stabs[j]));
            }
        }
    }

    #[test]
    fn test_all_codes_available() {
        for code_name in available_codes() {
            assert!(get_code_by_name(code_name).is_some());
            assert!(get_code_info(code_name).is_some());
        }
    }
}
