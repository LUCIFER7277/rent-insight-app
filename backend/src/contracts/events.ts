export class DomainEvent {
  _id: string = "";
  type: string = "";
  occurredAt?: string;
  actor?: string;
  tenantId?: string;
  correlationId?: string;
  causationId?: string | null;
  version?: number;
  payload: any;
  static parse(data: any): any { return data; }
}
