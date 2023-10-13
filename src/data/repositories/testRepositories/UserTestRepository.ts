import { User } from "../../../domain/entities/User";
import { createAdminUser } from "../../../domain/entities/__tests__/userFixtures";
import { Future } from "../../../domain/entities/generic/Future";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { FutureData } from "../../api-futures";

export class UserTestRepository implements UserRepository {
    saveLocale(isUiLocale: boolean, locale: string): FutureData<void> {
        throw new Error("Method not implemented.");
    }
    public getCurrent(): FutureData<User> {
        return Future.success(createAdminUser());
    }

    public savePassword(password: string): FutureData<string> {
        return Future.success("");
    }
}
