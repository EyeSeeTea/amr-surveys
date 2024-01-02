import { render } from "@testing-library/react";
import App from "../App";
import { getAdminTestContext, getHospitalDataEntryTestContext } from "../../../../utils/tests";
import { Provider } from "@dhis2/app-runtime";
import { CurrentModuleContext } from "../../../contexts/current-module-context";
import { createModuleList } from "../../../../domain/entities/__tests__/moduleFixtures";
import { Worker } from "./workerMock";

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

        window.Worker = window.Worker || new Worker("");
    });

    it("renders the feedback component", async () => {
        const view = getView();

        expect(await view.findByText("Send feedback")).toBeInTheDocument();
    });

    it("renders left menu", async () => {
        const view = getView();

        expect(await view.findByText("PPS")).toBeInTheDocument();
    });

    it("Survey menu click navigates to PPS survey form list for Admin user ", async () => {
        const view = getView();

        const ppsSurveysButton = await view.findByRole("button", {
            name: /Surveys/i,
        });

        //Before click we are at homepage
        expect(window.location.toString()).toBe("http://localhost:3000/#/");

        //click the PPS surveys menu button
        ppsSurveysButton.click();

        //After click we are at survey list page
        expect(window.location.toString()).toBe("http://localhost:3000/#/surveys/PPSSurveyForm");
    });

    it("Survey menu click navigates to Hospital form list for hospital data entry user ", async () => {
        const view = getHospitalDataEntryView();

        const ppsSurveysButton = await view.findByRole("button", {
            name: /Surveys/i,
        });

        //click the PPS surveys menu button
        ppsSurveysButton.click();

        //After click we are at survey list page
        expect(window.location.toString()).toBe("http://localhost:3000/#/surveys/PPSHospitalForm");
    });
});

function getView() {
    const { compositionRoot } = getAdminTestContext();
    const currentModule = createModuleList().at(0);
    return render(
        <Provider config={{ baseUrl: "http://localhost:8080", apiVersion: 30 }}>
            <CurrentModuleContext.Provider
                value={{
                    currentModule: currentModule,
                    changeCurrentModule: () => {},
                    resetCurrentModule: () => {},
                }}
            >
                <App compositionRoot={compositionRoot} />
            </CurrentModuleContext.Provider>
        </Provider>
    );
}

function getHospitalDataEntryView() {
    const { compositionRoot } = getHospitalDataEntryTestContext();
    const currentModule = createModuleList().at(0);
    return render(
        <Provider config={{ baseUrl: "http://localhost:8080", apiVersion: 30 }}>
            <CurrentModuleContext.Provider
                value={{
                    currentModule: currentModule,
                    changeCurrentModule: () => {},
                    resetCurrentModule: () => {},
                }}
            >
                <App compositionRoot={compositionRoot} />
            </CurrentModuleContext.Provider>
        </Provider>
    );
}
