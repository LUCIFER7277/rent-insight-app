export class Entity { id?: string; [key: string]: any; static parse(data: any): any { return data; } }
export class Lead extends Entity {}
export class Tour extends Entity {}
export class Todo extends Entity {}
export class PostTourUpdate {}
export class Activity extends Entity {}
