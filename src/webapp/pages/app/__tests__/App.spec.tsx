import { render } from "@testing-library/react";
import App from "../App";
import { getTestContext } from "../../../../utils/tests";
import { Provider } from "@dhis2/app-runtime";

describe("App", () => {
    it("renders the feedback component", async () => {
        window.matchMedia =
            window.matchMedia ||
            function () {
                return {
                    matches: false,
                    addListener: function () {},
                    addEventListener: function () {},
                    removeListener: function () {},
                };
            };
        const view = getView();

        expect(await view.findByText("Send feedback")).toBeInTheDocument();
    });
});

function getView() {
    const { compositionRoot } = getTestContext();
    return render(
        <Provider config={{ baseUrl: "http://localhost:8080", apiVersion: 30 }}>
            <App compositionRoot={compositionRoot} />
        </Provider>
    );
}
