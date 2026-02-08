#![allow(dead_code)]
/// Pauli operator types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Pauli {
    I, // Identity
    X, // Pauli-X
    Y, // Pauli-Y
    Z, // Pauli-Z
}

/// Phase factor for Pauli operators: ±1, ±i
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Phase {
    Plus,   // +1
    Minus,  // -1
    PlusI,  // +i
    MinusI, // -i
}

impl Pauli {
    /// Multiply two Pauli operators, returning (phase, result)
    /// Uses the multiplication table:
    /// I*X=X, I*Y=Y, I*Z=Z
    /// X*Y=iZ, Y*Z=iX, Z*X=iY
    /// X*X=I, Y*Y=I, Z*Z=I
    pub fn multiply(self, other: Pauli) -> (Phase, Pauli) {
        use Pauli::*;
        use Phase::*;

        match (self, other) {
            (I, p) | (p, I) => (Plus, p),
            (X, X) | (Y, Y) | (Z, Z) => (Plus, I),
            (X, Y) => (PlusI, Z),
            (Y, X) => (MinusI, Z),
            (Y, Z) => (PlusI, X),
            (Z, Y) => (MinusI, X),
            (Z, X) => (PlusI, Y),
            (X, Z) => (MinusI, Y),
        }
    }

    /// Check if two Pauli operators commute
    pub fn commutes_with(self, other: Pauli) -> bool {
        use Pauli::*;
        matches!((self, other), (I, _) | (_, I) | (X, X) | (Y, Y) | (Z, Z))
    }

    /// Convert to character representation
    pub fn to_char(self) -> char {
        match self {
            Pauli::I => 'I',
            Pauli::X => 'X',
            Pauli::Y => 'Y',
            Pauli::Z => 'Z',
        }
    }

    /// Parse from character
    pub fn from_char(c: char) -> Option<Pauli> {
        match c {
            'I' => Some(Pauli::I),
            'X' => Some(Pauli::X),
            'Y' => Some(Pauli::Y),
            'Z' => Some(Pauli::Z),
            _ => None,
        }
    }
}

impl Phase {
    /// Multiply two phases
    pub fn multiply(self, other: Phase) -> Phase {
        use Phase::*;
        match (self, other) {
            (Plus, p) | (p, Plus) => p,
            (Minus, Minus) => Plus,
            (Minus, PlusI) => MinusI,
            (Minus, MinusI) => PlusI,
            (PlusI, PlusI) => Minus,
            (PlusI, MinusI) => Plus,
            (PlusI, Minus) => MinusI,
            (MinusI, MinusI) => Minus,
            (MinusI, PlusI) => Plus,
            (MinusI, Minus) => PlusI,
        }
    }

    /// Get the sign (-1 or +1), ignoring imaginary part
    pub fn sign(self) -> i32 {
        match self {
            Phase::Plus | Phase::PlusI => 1,
            Phase::Minus | Phase::MinusI => -1,
        }
    }

    /// Negate the phase
    pub fn negate(self) -> Phase {
        match self {
            Phase::Plus => Phase::Minus,
            Phase::Minus => Phase::Plus,
            Phase::PlusI => Phase::MinusI,
            Phase::MinusI => Phase::PlusI,
        }
    }
}

/// Multi-qubit Pauli string (tensor product of Pauli operators)
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PauliString {
    pub phase: Phase,
    pub paulis: Vec<Pauli>,
}

impl PauliString {
    /// Create a new Pauli string with identity on all qubits
    pub fn identity(n_qubits: usize) -> Self {
        PauliString {
            phase: Phase::Plus,
            paulis: vec![Pauli::I; n_qubits],
        }
    }

    /// Create from a string like "IXYZ"
    pub fn from_str(s: &str) -> Option<Self> {
        let paulis: Option<Vec<Pauli>> = s.chars().map(Pauli::from_char).collect();
        paulis.map(|p| PauliString {
            phase: Phase::Plus,
            paulis: p,
        })
    }

    /// Number of qubits
    pub fn n_qubits(&self) -> usize {
        self.paulis.len()
    }

    /// Multiply two Pauli strings
    pub fn multiply(&self, other: &PauliString) -> PauliString {
        assert_eq!(self.n_qubits(), other.n_qubits());

        let mut result_phase = self.phase;
        let mut result_paulis = Vec::with_capacity(self.n_qubits());

        for (p1, p2) in self.paulis.iter().zip(other.paulis.iter()) {
            let (phase, pauli) = p1.multiply(*p2);
            result_phase = result_phase.multiply(phase);
            result_paulis.push(pauli);
        }

        PauliString {
            phase: result_phase,
            paulis: result_paulis,
        }
    }

    /// Check if two Pauli strings commute
    pub fn commutes_with(&self, other: &PauliString) -> bool {
        assert_eq!(self.n_qubits(), other.n_qubits());

        let mut anticommute_count = 0;
        for (p1, p2) in self.paulis.iter().zip(other.paulis.iter()) {
            if !p1.commutes_with(*p2) {
                anticommute_count += 1;
            }
        }

        // Two Pauli strings commute if they anticommute on an even number of qubits
        anticommute_count % 2 == 0
    }

    /// Convert to string representation
    pub fn to_string(&self) -> String {
        let phase_str = match self.phase {
            Phase::Plus => "",
            Phase::Minus => "-",
            Phase::PlusI => "+i",
            Phase::MinusI => "-i",
        };

        let pauli_str: String = self.paulis.iter().map(|p| p.to_char()).collect();
        format!("{}{}", phase_str, pauli_str)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pauli_multiply() {
        assert_eq!(Pauli::X.multiply(Pauli::Y), (Phase::PlusI, Pauli::Z));
        assert_eq!(Pauli::Y.multiply(Pauli::X), (Phase::MinusI, Pauli::Z));
        assert_eq!(Pauli::X.multiply(Pauli::X), (Phase::Plus, Pauli::I));
    }

    #[test]
    fn test_pauli_commute() {
        assert!(Pauli::X.commutes_with(Pauli::X));
        assert!(Pauli::I.commutes_with(Pauli::Y));
        assert!(!Pauli::X.commutes_with(Pauli::Z));
    }

    #[test]
    fn test_pauli_string_multiply() {
        let p1 = PauliString::from_str("XY").unwrap();
        let p2 = PauliString::from_str("YZ").unwrap();
        let result = p1.multiply(&p2);

        // XY * YZ = X(YY)Z = X(I)Z = -iXZ
        assert_eq!(result.phase, Phase::MinusI);
        assert_eq!(result.paulis, vec![Pauli::Z, Pauli::X]);
    }

    #[test]
    fn test_pauli_string_commute() {
        let p1 = PauliString::from_str("XX").unwrap();
        let p2 = PauliString::from_str("ZZ").unwrap();
        assert!(p1.commutes_with(&p2)); // anticommute on 2 qubits -> commute

        let p3 = PauliString::from_str("XI").unwrap();
        let p4 = PauliString::from_str("ZI").unwrap();
        assert!(!p3.commutes_with(&p4)); // anticommute on 1 qubit -> anticommute
    }
}
