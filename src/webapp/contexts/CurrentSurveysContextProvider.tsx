import { PropsWithChildren, useState } from "react";
import { Id } from "../../domain/entities/Ref";
import { CurrentSurveysContext } from "./current-surveys-context";

export const CurrentSurveysContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [currentPPSSurveyForm, setCurrentPPSSurveyForm] = useState<Id>();

    const changeCurrentPPSSurveyForm = (surveyId: Id | undefined) => {
        setCurrentPPSSurveyForm(surveyId);
    };
    return (
        <CurrentSurveysContext.Provider
            value={{ currentPPSSurveyForm, changeCurrentPPSSurveyForm }}
        >
            {children}
        </CurrentSurveysContext.Provider>
    );
};
