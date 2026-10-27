import { expect, afterEach } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// The App takes several seconds to render when all test files run in parallel; the 1 s default made page tests fail.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
    cleanup();
});
