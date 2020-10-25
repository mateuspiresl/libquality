import { average, standardDeviation } from '../math-helper';

describe('Math', () => {
  describe('#average', () => {
    it('should return 0 for empty values', () => {
      expect(average([])).toBe(0);
    });

    it('should return the average of the values', () => {
      expect(average([1])).toBe(1);
      expect(average([1, 2])).toBe(1.5);
      expect(average([-2, 2])).toBe(0);
    });
  });

  describe('#standardDeviation', () => {
    it('should return 0 for empty values', () => {
      expect(standardDeviation([])).toBe(0);
    });

    it('should return the standard deviation of the values', () => {
      function test(values: number[], expected: number) {
        expect(Math.abs(standardDeviation(values) - expected)).toBeLessThan(
          1e-3,
        );
      }

      test([1], 0);
      test([1, 1], 0);
      test([-2, 2], 2);
      test([10, 12, 23, 23, 16, 23, 21, 16], 4.898);
      test(
        [9, 2, 5, 4, 12, 7, 8, 11, 9, 3, 7, 4, 12, 5, 4, 10, 9, 6, 9, 4],
        2.983,
      );
    });
  });
});
