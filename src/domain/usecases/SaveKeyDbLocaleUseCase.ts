import { FutureData } from "../../data/api-futures";
import { UserRepository } from "../repositories/UserRepository";

export class SaveKeyDbLocaleUseCase {
    constructor(private usersRepository: UserRepository) {}

    execute(keyDbLocale: string): FutureData<void | unknown> {
        return this.usersRepository.saveLocale(false, keyDbLocale);
    }
}
