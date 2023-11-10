import { FutureData } from "../../data/api-futures";
import { UserRepository } from "../repositories/UserRepository";

export class SavePasswordUseCase {
    constructor(private usersRepository: UserRepository) {}

    execute(password: string): FutureData<string> {
        return this.usersRepository.savePassword(password);
    }
}
