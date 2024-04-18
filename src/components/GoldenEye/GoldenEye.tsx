import { Alert, Button, NativeSelect, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { UserGuide } from "../UserGuide/UserGuide";
import { SaveOutputToTextFile_v2 } from "../SaveOutputToFile/SaveOutputToTextFile";
import { LoadingOverlayAndCancelButtonPkexec } from "../OverlayAndCancelButton/OverlayAndCancelButton";

const title = "GoldenEye";
const description_userguide =
    "GoldenEye is a HTTP DoS Test Tool, where it withholds the potential to test whether or not a site is susceptible " +
    "to a Denial of Service (DoS) attack. The tool allows for several connection in parallel against a URL to check " +
    "if the web sever is able to be compromised.\n\nFurther information can be found at: https://www.kali.org/tools/goldeneye/\n\n" +
    "Using GoldenEye:\n" +
    "Step 1: Enter a valid URL of the target.\n" +
    "       Eg: https://www.google.com\n\n" +
    "Step 2: Enter any additional options for the scan.\n" +
    "       Eg: U\n\n" +
    "Step 3: Enter any additional parameters for the scan.\n" +
    "       Eg: W 100\n\n" +
    "Step 4: Click Scan to commence GoldenEye's operation.\n\n" +
    "Step 5: View the Output block below to view the results of the tool's execution.";

interface FormValues {
    url: string;
    useragent: string;
    worker: number;
    sockets: number;
    method: string;
    sslcheck: string;
}

const DosHTTPMethod = ["get", "post", "random"];
const SSLCheckStatus = ["Yes", "No"];

const GoldenEye = () => {
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState("");
    const [pid, setPid] = useState("");
    const [allowSave, setAllowSave] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [selectedmethod, setSelectedMethod] = useState("");
    const [selectedSSLCheck, setSelectedSSLCheck] = useState("");

    let form = useForm({
        initialValues: {
            url: "",
            useragent: "",
            worker: 0,
            sockets: 0,
            method: "",
            sslcheck: "",
        },
    });

    // Uses the callback function of runCommandGetPidAndOutput to handle and save data
    // generated by the executing process into the output state variable.
    const handleProcessData = useCallback((data: string) => {
        setOutput((prevOutput) => prevOutput + "\n" + data); // Update output
    }, []);

    // Uses the onTermination callback function of runCommandGetPidAndOutput to handle
    // the termination of that process, resetting state variables, handling the output data,
    // and informing the user.
    const handleProcessTermination = useCallback(
        ({ code, signal }: { code: number; signal: number }) => {
            if (code === 0) {
                handleProcessData("\nProcess completed successfully.");
            } else if (signal === 15) {
                handleProcessData("\nProcess was manually terminated.");
            } else {
                handleProcessData(`\nProcess terminated with exit code: ${code} and signal code: ${signal}`);
            }
            // Clear the child process pid reference
            setPid("");
            // Cancel the Loading Overlay
            setLoading(false);

            // Allow Saving as the output is finalised
            setAllowSave(true);
            setHasSaved(false);
        },
        [handleProcessData]
    );

    // Actions taken after saving the output
    const handleSaveComplete = () => {
        // Indicating that the file has saved which is passed
        // back into SaveOutputToTextFile to inform the user
        setHasSaved(true);
        setAllowSave(false);
    };

    const onSubmit = async (values: FormValues) => {
        setLoading(true);

        const args = [`/home/kali/Deakin-Detonator-Toolkit/src-tauri/exploits/GoldenEye/goldeneye.py`, `${values.url}`];

        values.useragent ? args.push(`-u`, `${values.useragent}`) : undefined;
        values.worker ? args.push(`-w`, `${values.worker}`) : undefined;
        values.sockets ? args.push(`-s`, `${values.sockets}`) : undefined;
        selectedmethod ? args.push(`-m`, selectedmethod) : undefined;
        selectedSSLCheck === "No" ? args.push(`-n`) : undefined;

        try {
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "python3",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setPid(result.pid);
            setOutput(result.output);
        } catch (e: any) {
            setOutput(e.message);
        }
    };

    const clearOutput = useCallback(() => {
        setOutput("");
        setHasSaved(false);
        setAllowSave(false);
    }, [setOutput]);

    return (
        <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
            <Stack>
                {LoadingOverlayAndCancelButtonPkexec(loading, pid, handleProcessData, handleProcessTermination)}
                {UserGuide(title, description_userguide)}
                <TextInput
                    label={"Url of the target"}
                    placeholder={"Example: https://www.google.com"}
                    required
                    {...form.getInputProps("url")}
                />
                <TextInput
                    label={"List of user agents"}
                    placeholder={"Please enter filepath for the list of useragent"}
                    {...form.getInputProps("useragent")}
                />
                <TextInput
                    label={"Number of concurrent workers"}
                    placeholder={"Please specify a number (Default = 10)"}
                    {...form.getInputProps("worker")}
                />
                <TextInput
                    label={"Number of concurrent sockets"}
                    placeholder={"Please specify a number (Default = 500)"}
                    {...form.getInputProps("sockets")}
                />
                <NativeSelect
                    value={selectedmethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    title={"HTTP Method"}
                    data={DosHTTPMethod}
                    placeholder={"HTTP Method"}
                    description={"Please select type of HTTP request to flood server with"}
                />
                <NativeSelect
                    value={selectedSSLCheck}
                    onChange={(e) => setSelectedSSLCheck(e.target.value)}
                    title={"SSL Check"}
                    data={SSLCheckStatus}
                    placeholder={"SSL Check"}
                    description={"Do you want to verify the ssl certificate"}
                />
                <Button type={"submit"}>Launch Dos Attack</Button>
                {SaveOutputToTextFile_v2(output, allowSave, hasSaved, handleSaveComplete)}
                <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
            </Stack>
        </form>
    );
};

export default GoldenEye;
