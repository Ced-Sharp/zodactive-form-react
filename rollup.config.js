import { dts } from "rollup-plugin-dts";

export default {
    input: "./types/index.d.ts",
    output: [
        {
            file: "./dist/zodactive-form-react.d.ts",
            format: "es",
        },
    ],
    plugins: [dts()],
};
