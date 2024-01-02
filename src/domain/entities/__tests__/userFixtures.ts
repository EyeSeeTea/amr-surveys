import { User, UserRole } from "../User";
import { NamedRef } from "../Ref";

export function createAdminUser(): User {
    const adminRoles = [{ id: "Hg7n0MwzUQn", name: "Super user", authorities: ["ALL"] }];

    return createUser(adminRoles, [{ id: "3", name: "pps-admin-ug" }]);
}
export function createNonAdminUser(): User {
    const nonAdminRoles = [{ id: "Hg7n0MwzUQn", name: "Malaria", authorities: ["F_EXPORT_DATA"] }];

    return createUser(nonAdminRoles, [{ id: "1", name: "pps-capture-ug" }]);
}
export function createUserWithGroups(userGroups: NamedRef[] = []): User {
    return new User({
        id: "YjJdEO6d38H",
        name: "John Traore",
        username: "user",
        userRoles: [],
        userGroups,
        userCountriesAccess: [],
        userHospitalsAccess: [],
        email: "johntraore@johntraore.com",
        phoneNumber: "1234567890",
        introduction: "",
        birthday: "01/01/1990",
        nationality: "",
        employer: "",
        jobTitle: "",
        education: "",
        interests: "",
        languages: "",
        settings: {
            keyUiLocale: "en",
            keyDbLocale: "en",
            keyMessageEmailNotification: true,
            keyMessageSmsNotification: true,
        },
        organisationUnits: [],
        dataViewOrganisationUnits: [],
    });
}
function createUser(userRoles: UserRole[], userGroups: NamedRef[] = []): User {
    return new User({
        id: "kQiwoyMYHBS",
        name: "John Traore",
        username: "user",
        userRoles,
        userGroups,
        userCountriesAccess: [],
        userHospitalsAccess: [],
        email: "johntraore@johntraore.com",
        phoneNumber: "1234567890",
        introduction: "",
        birthday: "01/01/1990",
        nationality: "",
        employer: "",
        jobTitle: "",
        education: "",
        interests: "",
        languages: "",
        settings: {
            keyUiLocale: "en",
            keyDbLocale: "en",
            keyMessageEmailNotification: true,
            keyMessageSmsNotification: true,
        },
        organisationUnits: [],
        dataViewOrganisationUnits: [],
    });
}
