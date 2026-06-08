export class DomainEvent { _id?: string; type: string = ""; payload: any; tenantId?: string; static parse(data: any): any { return data; } }
