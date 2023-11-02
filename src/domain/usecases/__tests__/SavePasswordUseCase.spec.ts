import { getTestCompositionRoot } from "../../../CompositionRoot";

describe("SavePasswordUseCase", () => {
    it("saves password successfully", async () => {
        const compositionRoot = getTestCompositionRoot();
        const res = await compositionRoot.users.savePassword.execute("newTestPassword").toPromise();
        expect(res).toEqual("Success");
    });
});
