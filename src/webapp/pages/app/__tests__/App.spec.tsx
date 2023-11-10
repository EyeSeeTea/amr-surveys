import { render } from "@testing-library/react";
import App from "../App";
import { getTestContext } from "../../../../utils/tests";
import { Provider } from "@dhis2/app-runtime";

describe("App", () => {
    beforeAll(() => {
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
    });

    it("renders the feedback component", async () => {
        const view = getView();

        expect(await view.findByText("Send feedback")).toBeInTheDocument();
    });

    it("renders left menu", async () => {
        const view = getView();

        expect(await view.findByText("Point Prevalence Survey")).toBeInTheDocument();
    });

    it("Survey menu click navigates to survey list", async () => {
        const view = getView();

        const ppsSurveysButton = await view.findByRole("button", {
            name: /Surveys/i,
        });
        console.debug(window.location);
        //Before click we are at homepage
        expect(window.location.toString()).toBe("http://localhost:3000/#/");

        //click the PPS surveys menu button
        ppsSurveysButton.click();

        //After click we are at survey list page
        expect(window.location.toString()).toBe("http://localhost:3000/#/surveys/PPSSurveyForm");
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
