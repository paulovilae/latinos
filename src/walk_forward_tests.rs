#[cfg(test)]
mod tests {
    use crate::walk_forward::generate_walk_forward_matrices;

    #[test]
    fn test_generate_walk_forward() {
        let total = 100;
        let train_size = 50;
        let test_size = 20;
        let step = 10;
        
        let matrices = generate_walk_forward_matrices(total, train_size, test_size, step);
        
        assert_eq!(matrices.len(), 4);
        assert_eq!(matrices[0].train_start, 0);
        assert_eq!(matrices[0].train_end, 50);
        assert_eq!(matrices[0].test_start, 50);
        assert_eq!(matrices[0].test_end, 70);
        
        assert_eq!(matrices[1].train_start, 10);
        assert_eq!(matrices[3].train_start, 30);
        assert_eq!(matrices[3].test_end, 100);
    }
}
