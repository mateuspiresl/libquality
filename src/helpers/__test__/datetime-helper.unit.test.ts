import { timeToDaysString } from '../datetime-helper';

describe('Datetime helper', () => {
  it('#timeToDaysString should return the time in days followed by the letter d', () => {
    expect(timeToDaysString(0)).toBe('0d');
    expect(timeToDaysString(1000)).toBe('0d');
    expect(timeToDaysString(60 * 60 * 1000)).toBe('0d');
    expect(timeToDaysString(13 * 60 * 60 * 1000)).toBe('1d');
    expect(timeToDaysString(24 * 60 * 60 * 1000)).toBe('1d');
    expect(timeToDaysString(100 * 24 * 60 * 60 * 1000)).toBe('100d');
    expect(timeToDaysString(1000 * 24 * 60 * 60 * 1000)).toBe('1000d');
  });
});
