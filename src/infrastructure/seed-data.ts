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
    sampleStarterCode: `// Parking Lot System - Starter Template
export enum VehicleType {
  MOTORCYCLE,
  CAR,
  TRUCK,
}

export interface IParkingStrategy {
  findSlot(floors: ParkingFloor[], vehicleType: VehicleType): ParkingSlot | null;
}

export interface IBillingStrategy {
  calculateFee(entryTime: Date, exitTime: Date, vehicleType: VehicleType): number;
}

export class Vehicle {
  private licensePlate: string;
  private type: VehicleType;

  constructor(licensePlate: string, type: VehicleType) {
    this.licensePlate = licensePlate;
    this.type = type;
  }

  public getLicensePlate(): string {
    return this.licensePlate;
  }

  public getType(): VehicleType {
    return this.type;
  }
}

export class ParkingSlot {
  private id: string;
  private supportedType: VehicleType;
  private isOccupied: boolean = false;

  constructor(id: string, supportedType: VehicleType) {
    this.id = id;
    this.supportedType = supportedType;
  }

  public getId(): string {
    return this.id;
  }

  public isAvailable(): boolean {
    return !this.isOccupied;
  }

  public assignVehicle(): void {
    this.isOccupied = true;
  }

  public vacate(): void {
    this.isOccupied = false;
  }
}

export class ParkingFloor {
  private floorNumber: number;
  private slots: ParkingSlot[];

  constructor(floorNumber: number, slots: ParkingSlot[]) {
    this.floorNumber = floorNumber;
    this.slots = slots;
  }

  public getSlots(): ParkingSlot[] {
    return this.slots;
  }
}

export class Ticket {
  private ticketId: string;
  private vehicle: Vehicle;
  private slot: ParkingSlot;
  private entryTime: Date;

  constructor(ticketId: string, vehicle: Vehicle, slot: ParkingSlot) {
    this.ticketId = ticketId;
    this.vehicle = vehicle;
    this.slot = slot;
    this.entryTime = new Date();
  }

  public getTicketId(): string {
    return this.ticketId;
  }
}
`,
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
    sampleStarterCode: `// Elevator Control System - Starter Template
export enum Direction {
  UP,
  DOWN,
  IDLE,
}

export enum DoorState {
  OPEN,
  CLOSED,
}

export interface FloorRequest {
  sourceFloor: number;
  destinationFloor?: number;
  direction: Direction;
}

export interface IElevatorDispatcher {
  selectElevator(elevators: Elevator[], request: FloorRequest): Elevator | null;
}

export class Door {
  private state: DoorState = DoorState.CLOSED;

  public open(): void {
    this.state = DoorState.OPEN;
  }

  public close(): void {
    this.state = DoorState.CLOSED;
  }

  public isOpen(): boolean {
    return this.state === DoorState.OPEN;
  }
}

export class Elevator {
  private id: string;
  private currentFloor: number = 0;
  private direction: Direction = Direction.IDLE;
  private door: Door;

  constructor(id: string) {
    this.id = id;
    this.door = new Door();
  }

  public getId(): string {
    return this.id;
  }

  public getCurrentFloor(): number {
    return this.currentFloor;
  }

  public getDirection(): Direction {
    return this.direction;
  }

  public moveToFloor(floor: number): void {
    this.currentFloor = floor;
  }
}

export class ElevatorController {
  private elevators: Elevator[];
  private dispatcher: IElevatorDispatcher;

  constructor(elevators: Elevator[], dispatcher: IElevatorDispatcher) {
    this.elevators = elevators;
    this.dispatcher = dispatcher;
  }

  public requestElevator(request: FloorRequest): Elevator | null {
    const selected = this.dispatcher.selectElevator(this.elevators, request);
    return selected;
  }
}
`,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
  },
];
