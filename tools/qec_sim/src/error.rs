use crate::pauli::Pauli;
use crate::stabilizer::StabilizerState;
use serde::{Deserialize, Serialize};

/// Error types that can be applied to qubits
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ErrorType {
    X, // Bit flip
    Y, // Bit + phase flip
    Z, // Phase flip
}

/// Represents an error on a specific qubit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Error {
    pub qubit: usize,
    pub error_type: ErrorType,
}

impl Error {
    pub fn new(qubit: usize, error_type: ErrorType) -> Self {
        Error { qubit, error_type }
    }

    /// Apply this error to a stabilizer state
    pub fn apply_to_state(&self, state: &mut StabilizerState) {
        // Errors are just Pauli operations
        match self.error_type {
            ErrorType::X => {
                // X is H-Z-H, or we can implement directly
                // For stabilizer formalism, X flips the sign of any stabilizer
                // that has Z on this qubit
                for i in 0..state.n_qubits() {
                    if state.get_stabilizer(i).paulis[self.qubit] == Pauli::Z
                        || state.get_stabilizer(i).paulis[self.qubit] == Pauli::Y
                    {
                        let mut stab = state.get_stabilizer(i);
                        stab.phase = stab.phase.negate();
                        state.set_stabilizer(i, &stab);
                    }
                }
            }
            ErrorType::Y => {
                // Y error flips signs of stabilizers with X or Z
                for i in 0..state.n_qubits() {
                    let pauli_at_qubit = state.get_stabilizer(i).paulis[self.qubit];
                    if pauli_at_qubit != Pauli::I && pauli_at_qubit != Pauli::Y {
                        let mut stab = state.get_stabilizer(i);
                        stab.phase = stab.phase.negate();
                        state.set_stabilizer(i, &stab);
                    }
                }
            }
            ErrorType::Z => {
                // Z error flips signs of stabilizers with X or Y
                for i in 0..state.n_qubits() {
                    if state.get_stabilizer(i).paulis[self.qubit] == Pauli::X
                        || state.get_stabilizer(i).paulis[self.qubit] == Pauli::Y
                    {
                        let mut stab = state.get_stabilizer(i);
                        stab.phase = stab.phase.negate();
                        state.set_stabilizer(i, &stab);
                    }
                }
            }
        }
    }
}

/// Syndrome measurement result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Syndrome {
    /// Measurement outcomes for each stabilizer (+1 or -1)
    pub outcomes: Vec<i32>,
}

impl Syndrome {
    /// Compute syndrome from stabilizer state
    /// Returns +1 if stabilizer eigenvalue is +1, -1 if eigenvalue is -1
    pub fn from_state(state: &StabilizerState) -> Self {
        let outcomes = (0..state.n_qubits())
            .map(|i| {
                let stab = state.get_stabilizer(i);
                stab.phase.sign()
            })
            .collect();

        Syndrome { outcomes }
    }

    /// Check if syndrome indicates an error (any -1 outcome)
    pub fn has_error(&self) -> bool {
        self.outcomes.iter().any(|&o| o == -1)
    }

    /// Get indices of triggered stabilizers (outcomes = -1)
    pub fn triggered_stabilizers(&self) -> Vec<usize> {
        self.outcomes
            .iter()
            .enumerate()
            .filter(|(_, &o)| o == -1)
            .map(|(i, _)| i)
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_detection() {
        let mut state = StabilizerState::new(3);
        // Initial state |000⟩ with stabilizers ZII, IZI, IIZ

        // No errors
        let syndrome = Syndrome::from_state(&state);
        assert!(!syndrome.has_error());
        assert_eq!(syndrome.outcomes, vec![1, 1, 1]);

        // Apply X error on qubit 0
        let error = Error::new(0, ErrorType::X);
        error.apply_to_state(&mut state);

        // Should trigger stabilizer 0 (ZII)
        let syndrome = Syndrome::from_state(&state);
        assert!(syndrome.has_error());
        assert_eq!(syndrome.triggered_stabilizers(), vec![0]);
    }

    #[test]
    fn test_multiple_errors() {
        let mut state = StabilizerState::new(3);

        // Apply errors on qubits 0 and 2
        Error::new(0, ErrorType::Z).apply_to_state(&mut state);
        Error::new(2, ErrorType::X).apply_to_state(&mut state);

        let syndrome = Syndrome::from_state(&state);
        let triggered = syndrome.triggered_stabilizers();

        // Should trigger stabilizers for qubits 0 and 2
        assert!(triggered.contains(&2));
    }
}
