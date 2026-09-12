import { Problem } from '../domain/problem';

export const SEED_PROBLEMS: Problem[] = [
  {
    id: 'problem-parking-lot',
    title: 'Parking Lot System',
    slug: 'parking-lot',
    description: `Design an automated multi-floor Parking Lot system.
    
The system should support:
1. Different vehicle types: Motorcycles, Cars, and Trucks.
2. Multiple floors with dedicated slots for different vehicle types.
3. Ticket generation upon entry with timestamp and assigned slot.
4. Flexible payment/billing strategies (e.g., Hourly Rate, Flat Rate).
5. Parking slot assignment strategy (e.g., Nearest to entry gate, First available).`,
    requirements: [
      {
        id: 'req-1',
        description: 'Define clean interfaces for IParkingStrategy and IBillingStrategy to support multiple algorithm variants.',
        expectedInterfaces: ['IParkingStrategy', 'IBillingStrategy'],
      },
      {
        id: 'req-2',
        description: 'Implement domain entity classes for Vehicle (and subclasses or enum types), ParkingSlot, ParkingFloor, Ticket, and Gate.',
        expectedClasses: ['Vehicle', 'Car', 'Motorcycle', 'Truck', 'ParkingSlot', 'ParkingFloor', 'Ticket', 'Gate', 'ParkingLotManager'],
      },
      {
        id: 'req-3',
        description: 'Ensure proper encapsulation by protecting internal fields (private/protected) and providing accessor methods.',
      },
    ],
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
  },
  {
    id: 'problem-elevator-system',
    title: 'Elevator Control System',
    slug: 'elevator-system',
    description: `Design a multi-elevator control and dispatch system for a high-rise building.

The system should support:
1. Multiple elevators moving UP, DOWN, or remaining IDLE.
2. Internal requests (floor selection from inside elevator) and External requests (up/down button on floor).
3. Pluggable elevator dispatching algorithms (e.g. FCFS, Shortest Seek Time, SCAN/Look).
4. Safety features (overload detection, emergency stop, door control).`,
    requirements: [
      {
        id: 'req-1',
        description: 'Define an IElevatorDispatcher interface for pluggable dispatch strategies.',
        expectedInterfaces: ['IElevatorDispatcher'],
      },
      {
        id: 'req-2',
        description: 'Implement domain entities: Elevator, ElevatorController, FloorRequest, and ElevatorCar.',
        expectedClasses: ['Elevator', 'ElevatorController', 'FloorRequest', 'Door'],
      },
      {
        id: 'req-3',
        description: 'Demonstrate proper Single Responsibility Principle (SRP) by separating dispatch logic from elevator hardware motion control.',
      },
    ],
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
  },
];
