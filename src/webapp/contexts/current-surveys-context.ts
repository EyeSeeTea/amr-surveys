import { useContext, createContext } from "react";
import { Id } from "../../domain/entities/Ref";

export interface CurrentSurveysContextProps {
    currentPPSSurveyForm: Id | undefined;
    changeCurrentPPSSurveyForm: (surveyId: Id | undefined) => void;
}

export const CurrentSurveysContext = createContext<CurrentSurveysContextProps>({
    currentPPSSurveyForm: undefined,
    changeCurrentPPSSurveyForm: () => {},
});

export function useCurrentSurveys() {
    const context = useContext(CurrentSurveysContext);
    if (context) {
        return context;
    } else {
        throw new Error("Current surveys context uninitialized");
    }
}
