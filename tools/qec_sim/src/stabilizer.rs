#![allow(dead_code)]
use crate::pauli::{Pauli, PauliString, Phase};
use serde::{Deserialize, Serialize};

/// Stabilizer state representation using symplectic (binary) tableau
/// This is based on the Gottesman-Knill theorem and Aaronson-Gottesman algorithm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StabilizerState {
    /// Number of qubits
    n_qubits: usize,

    /// Binary tableau: (n x 2n) matrix
    /// First n columns are X part, next n columns are Z part
    /// Rows 0..n are stabilizer generators
    /// We store as a flat vector for efficiency
    tableau: Vec<bool>,

    /// Phase vector (r in the tableau)
    /// false = +1, true = -1
    phases: Vec<bool>,
}

impl StabilizerState {
    /// Create a new stabilizer state initialized to |0...0⟩
    pub fn new(n_qubits: usize) -> Self {
        let mut tableau = vec![false; n_qubits * 2 * n_qubits];
        let phases = vec![false; n_qubits];

        // Initialize to |0...0⟩ state with stabilizers Z_i for each qubit i
        for i in 0..n_qubits {
            // Set Z part for qubit i in row i
            tableau[i * 2 * n_qubits + n_qubits + i] = true;
        }

        StabilizerState {
            n_qubits,
            tableau,
            phases,
        }
    }

    /// Get number of qubits
    pub fn n_qubits(&self) -> usize {
        self.n_qubits
    }

    /// Get X bit at position (row, col)
    fn get_x(&self, row: usize, col: usize) -> bool {
        self.tableau[row * 2 * self.n_qubits + col]
    }

    /// Set X bit at position (row, col)
    fn set_x(&mut self, row: usize, col: usize, val: bool) {
        self.tableau[row * 2 * self.n_qubits + col] = val;
    }

    /// Get Z bit at position (row, col)
    fn get_z(&self, row: usize, col: usize) -> bool {
        self.tableau[row * 2 * self.n_qubits + self.n_qubits + col]
    }

    /// Set Z bit at position (row, col)
    fn set_z(&mut self, row: usize, col: usize, val: bool) {
        self.tableau[row * 2 * self.n_qubits + self.n_qubits + col] = val;
    }

    /// Get phase for row
    fn get_phase(&self, row: usize) -> bool {
        self.phases[row]
    }

    /// Set phase for row
    fn set_phase(&mut self, row: usize, val: bool) {
        self.phases[row] = val;
    }

    /// Row addition (XOR) in the tableau
    fn row_add(&mut self, dest: usize, src: usize) {
        // Update phase using the g function
        let mut phase_update = 0;
        for q in 0..self.n_qubits {
            let x1 = self.get_x(dest, q);
            let z1 = self.get_z(dest, q);
            let x2 = self.get_x(src, q);
            let z2 = self.get_z(src, q);

            phase_update += Self::g_function(x1, z1, x2, z2);
        }

        // Update phase
        if phase_update % 4 == 2 {
            self.set_phase(dest, !self.get_phase(dest));
        }

        // XOR the rows
        for col in 0..2 * self.n_qubits {
            let val = self.tableau[dest * 2 * self.n_qubits + col]
                ^ self.tableau[src * 2 * self.n_qubits + col];
            self.tableau[dest * 2 * self.n_qubits + col] = val;
        }
    }

    /// g function for phase calculation (from Aaronson-Gottesman)
    fn g_function(x1: bool, z1: bool, x2: bool, z2: bool) -> i32 {
        match (x1, z1, x2, z2) {
            (false, false, _, _) => 0,
            (true, true, _, _) => {
                if z2 {
                    if x2 {
                        1
                    } else {
                        -1
                    }
                } else {
                    0
                }
            }
            (true, false, _, _) => {
                if z2 {
                    if x2 {
                        -1
                    } else {
                        1
                    }
                } else {
                    0
                }
            }
            (false, true, _, _) => {
                if x2 {
                    if z2 {
                        1
                    } else {
                        -1
                    }
                } else {
                    0
                }
            }
        }
    }

    /// Apply Hadamard gate to qubit
    pub fn apply_h(&mut self, qubit: usize) {
        for row in 0..self.n_qubits {
            let x = self.get_x(row, qubit);
            let z = self.get_z(row, qubit);

            // H: X <-> Z
            self.set_x(row, qubit, z);
            self.set_z(row, qubit, x);

            // Update phase if both X and Z were set
            if x && z {
                self.set_phase(row, !self.get_phase(row));
            }
        }
    }

    /// Apply S (phase) gate to qubit
    pub fn apply_s(&mut self, qubit: usize) {
        for row in 0..self.n_qubits {
            let x = self.get_x(row, qubit);
            let z = self.get_z(row, qubit);

            // S: X -> Y, Y -> -X, Z -> Z
            if x && !z {
                // X -> Y
                self.set_z(row, qubit, true);
            } else if x && z {
                // Y -> -X
                self.set_z(row, qubit, false);
                self.set_phase(row, !self.get_phase(row));
            }
        }
    }

    /// Apply CNOT gate (control -> target)
    pub fn apply_cnot(&mut self, control: usize, target: usize) {
        for row in 0..self.n_qubits {
            let xc = self.get_x(row, control);
            let zc = self.get_z(row, control);
            let xt = self.get_x(row, target);
            let zt = self.get_z(row, target);

            // CNOT transformation
            self.set_x(row, target, xt ^ xc);
            self.set_z(row, control, zc ^ zt);

            // Update phase
            if xc && zt && (xt != zc) {
                self.set_phase(row, !self.get_phase(row));
            }
        }
    }

    /// Apply CZ (controlled-Z) gate
    pub fn apply_cz(&mut self, qubit1: usize, qubit2: usize) {
        for row in 0..self.n_qubits {
            let x1 = self.get_x(row, qubit1);
            let z1 = self.get_z(row, qubit1);
            let x2 = self.get_x(row, qubit2);
            let z2 = self.get_z(row, qubit2);

            // CZ: Z_i Z_j unchanged, X_i -> X_i Z_j, X_j -> X_j Z_i
            self.set_z(row, qubit1, z1 ^ x2);
            self.set_z(row, qubit2, z2 ^ x1);

            // Update phase
            if x1 && x2 && (z1 != z2) {
                self.set_phase(row, !self.get_phase(row));
            }
        }
    }

    /// Get stabilizer generator as PauliString
    pub fn get_stabilizer(&self, index: usize) -> PauliString {
        let mut paulis = Vec::with_capacity(self.n_qubits);

        for q in 0..self.n_qubits {
            let x = self.get_x(index, q);
            let z = self.get_z(index, q);

            let pauli = match (x, z) {
                (false, false) => Pauli::I,
                (true, false) => Pauli::X,
                (false, true) => Pauli::Z,
                (true, true) => Pauli::Y,
            };
            paulis.push(pauli);
        }

        let phase = if self.get_phase(index) {
            Phase::Minus
        } else {
            Phase::Plus
        };

        PauliString { phase, paulis }
    }

    /// Set stabilizer generator from PauliString
    pub fn set_stabilizer(&mut self, index: usize, pauli_string: &PauliString) {
        assert_eq!(pauli_string.n_qubits(), self.n_qubits);

        for (q, pauli) in pauli_string.paulis.iter().enumerate() {
            let (x, z) = match pauli {
                Pauli::I => (false, false),
                Pauli::X => (true, false),
                Pauli::Y => (true, true),
                Pauli::Z => (false, true),
            };
            self.set_x(index, q, x);
            self.set_z(index, q, z);
        }

        self.set_phase(index, pauli_string.phase == Phase::Minus);
    }

    /// Get all stabilizers as vector of PauliStrings
    pub fn get_all_stabilizers(&self) -> Vec<PauliString> {
        (0..self.n_qubits).map(|i| self.get_stabilizer(i)).collect()
    }

    /// Create stabilizer state from a set of stabilizer generators
    pub fn from_stabilizers(n_qubits: usize, stabilizers: &[PauliString]) -> Self {
        assert_eq!(stabilizers.len(), n_qubits);

        let mut state = StabilizerState::new(n_qubits);
        for (i, stab) in stabilizers.iter().enumerate() {
            state.set_stabilizer(i, stab);
        }

        state
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initial_state() {
        let state = StabilizerState::new(3);

        // |000⟩ should have stabilizers Z0, Z1, Z2
        let stabs = state.get_all_stabilizers();
        assert_eq!(stabs[0].to_string(), "ZII");
        assert_eq!(stabs[1].to_string(), "IZI");
        assert_eq!(stabs[2].to_string(), "IIZ");
    }

    #[test]
    fn test_hadamard() {
        let mut state = StabilizerState::new(1);
        // Start with |0⟩, stabilizer Z

        state.apply_h(0);
        // After H, |+⟩, stabilizer X

        let stab = state.get_stabilizer(0);
        assert_eq!(stab.to_string(), "X");
    }

    #[test]
    fn test_cnot() {
        let mut state = StabilizerState::new(2);
        // Start with |00⟩, stabilizers Z0, Z1

        state.apply_h(0);
        // Now have |+0⟩, stabilizers X0, Z1

        state.apply_cnot(0, 1);
        // Now have |Φ+⟩ (Bell state), stabilizers X0X1, Z0Z1

        let stabs = state.get_all_stabilizers();
        assert_eq!(stabs[0].to_string(), "XX");
        assert_eq!(stabs[1].to_string(), "ZZ");
    }
}
