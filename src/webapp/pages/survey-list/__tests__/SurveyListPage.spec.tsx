import { render } from "@testing-library/react";
import { getTestContext } from "../../../../utils/tests";
import { Provider } from "@dhis2/app-runtime";
import App from "../../app/App";

describe("Survey List Page", () => {
    beforeAll(async () => {
        //set mock matchMedia functions
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

        //navigate to survey list page
        const view = getView();
        const ppsSurveysButton = await view.findByRole("button", {
            name: /Surveys/i,
        });
        //click the PPS surveys menu button
        ppsSurveysButton.click();
    });

    it("renders 'Create New Survey' button", async () => {
        const view = getView();

        const createNewSurveyButton = await view.findByRole("button", {
            name: /CREATE NEW SURVEY/i,
        });

        //Before click we are at homepage
        expect(createNewSurveyButton).toBeInTheDocument();
    });

    it("renders surveys list", async () => {
        const view = getView();
        //There are 2 surveys set in the test repository
        const survey1 = await view.findByText("TestSurvey1");
        const survey2 = await view.findByText("TestSurvey2");
        expect(survey1).toBeInTheDocument();
        expect(survey2).toBeInTheDocument();
    });

    it("navigates to New Survey Page on Create New Survey click", async () => {
        const view = getView();

        const createNewSurveyButton = await view.findByRole("button", {
            name: /CREATE NEW SURVEY/i,
        });
        console.debug(window.location);
        //Before click we are at survey list page
        expect(window.location.toString()).toBe("http://localhost:3000/#/surveys");

        //click the Create new survey button
        createNewSurveyButton.click();

        //After click we are at new survey page
        expect(window.location.toString()).toBe("http://localhost:3000/#/new-survey/PPSSurveyForm");
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
