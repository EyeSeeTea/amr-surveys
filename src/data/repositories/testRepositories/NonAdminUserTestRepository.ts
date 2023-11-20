import { User } from "../../../domain/entities/User";
import { createNonAdminUser } from "../../../domain/entities/__tests__/userFixtures";
import { Future } from "../../../domain/entities/generic/Future";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { FutureData } from "../../api-futures";

export class NonAdminUserTestRepository implements UserRepository {
    saveLocale(isUiLocale: boolean, locale: string): FutureData<void> {
        if (locale) return Future.success(undefined);
        else
            return Future.error({
                name: "ERR",
                message: `Error occurred on saving new locale settings: isUiLocale: ${isUiLocale}, locale: ${locale}`,
            });
    }
    public getCurrent(): FutureData<User> {
        return Future.success(createNonAdminUser());
    }

    public savePassword(password: string): FutureData<string> {
        if (password) return Future.success("OK");
        else return Future.error({ name: "ERR", message: "Error" });
    }
}
