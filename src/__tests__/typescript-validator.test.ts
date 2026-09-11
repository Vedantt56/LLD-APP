import { describe, it, expect } from 'vitest';
import {
  validateTypeScriptSubmission,
  isNonTypeScriptCode,
  InvalidTypeScriptSubmissionError,
} from '../validators/typescript-validator';

describe('TypeScript Submission Validator', () => {
  it('allows valid TypeScript solution code', () => {
    const validTS = `
      interface IParkingStrategy {
        park(vehicle: Vehicle): Spot;
      }
      class ParkingSpot {
        private spotId: string;
        constructor(id: string) {
          this.spotId = id;
        }
      }
    `;
    expect(isNonTypeScriptCode(validTS)).toBe(false);
    expect(() => validateTypeScriptSubmission(validTS)).not.toThrow();
  });

  it('rejects Python submissions with clear error message', () => {
    const pythonCode = `
def park_vehicle(spot_id):
    print("Parking vehicle")
    return True
`;
    expect(isNonTypeScriptCode(pythonCode)).toBe(true);
    expect(() => validateTypeScriptSubmission(pythonCode)).toThrow(InvalidTypeScriptSubmissionError);
    expect(() => validateTypeScriptSubmission(pythonCode)).toThrow(
      'Invalid submission. This platform supports TypeScript only. Please submit your solution in TypeScript.'
    );
  });

  it('rejects Java submissions with clear error message', () => {
    const javaCode = `
package com.lld.parking;

public class ParkingSpot {
    private String id;
    public static void main(String[] args) {
        System.out.println("Parking lot");
    }
}
`;
    expect(isNonTypeScriptCode(javaCode)).toBe(true);
    expect(() => validateTypeScriptSubmission(javaCode)).toThrow(InvalidTypeScriptSubmissionError);
    expect(() => validateTypeScriptSubmission(javaCode)).toThrow(
      'Invalid submission. This platform supports TypeScript only. Please submit your solution in TypeScript.'
    );
  });

  it('rejects C++ submissions', () => {
    const cppCode = `
#include <iostream>
int main() {
    std::cout << "Parking lot" << std::endl;
    return 0;
}
`;
    expect(isNonTypeScriptCode(cppCode)).toBe(true);
    expect(() => validateTypeScriptSubmission(cppCode)).toThrow(InvalidTypeScriptSubmissionError);
  });

  it('rejects Go submissions', () => {
    const goCode = `
package main
import "fmt"
func main() {
    fmt.Println("Parking lot")
}
`;
    expect(isNonTypeScriptCode(goCode)).toBe(true);
    expect(() => validateTypeScriptSubmission(goCode)).toThrow(InvalidTypeScriptSubmissionError);
  });
});
