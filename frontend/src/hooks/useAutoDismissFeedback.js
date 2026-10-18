import {
    useEffect,
    useRef
} from "react";


export const FEEDBACK_TIMEOUT_MS =
    7000;


export default function useAutoDismissFeedback(
    active,
    resetFeedback,
    delay = FEEDBACK_TIMEOUT_MS
) {
    const resetRef =
        useRef(
            resetFeedback
        );


    useEffect(() => {
        resetRef.current =
            resetFeedback;
    }, [
        resetFeedback
    ]);


    useEffect(() => {
        if (!active) {
            return undefined;
        }


        const timer =
            window.setTimeout(
                () => {
                    resetRef.current();
                },
                delay
            );


        return () => {
            window.clearTimeout(
                timer
            );
        };
    }, [
        active,
        delay
    ]);
}