import { FutureData } from "../../data/api-futures";
import { UserRepository } from "../repositories/UserRepository";

export class SaveKeyUiLocaleUseCase {
    constructor(private usersRepository: UserRepository) {}

    execute(keyUiLocale: string): FutureData<void | unknown> {
        return this.usersRepository.saveLocale(true, keyUiLocale);
    }
}
