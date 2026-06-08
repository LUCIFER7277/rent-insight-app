export class Entity { id: string = ""; static parse(data: any): any { return data; } }
export class Lead extends Entity {}
export class Tour extends Entity {}
export class Todo extends Entity {}
export class PostTourUpdate {}
