import _ from "../../domain/entities/generic/Collection";

export type Id = string;

export interface Ref {
    id: Id;
}

export interface NamedRef extends Ref {
    name: string;
}

export function updateCollection<Obj extends Ref>(objs: Obj[], obj: Obj) {
    if (_(objs).some(o => o.id === obj.id)) {
        return objs.map(o => (o.id === obj.id ? obj : o));
    } else {
        return objs;
    }
}
