export interface ActionOutcome {
    status: "success" | "error" | "intermediate-success";
    message: string;
}
