import { type ReactNode, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { Subtitle } from "./Titles";

// 1 history log visible on the right, types define the log style
export type HistoryEntry = {
    id: number;
    text: string | ReactNode;
    type: "system" | "spoiler" | "duplicator" | "error" | "success";
}

// base game properties
interface BaseGameProps {
    title: string;
    dashboard: ReactNode;
    status: string;
    controls?: ReactNode;
    g1Title: string;
    g1Graph: ReactNode;
    g2Title: string;
    g2Graph: ReactNode;
    menuRoute: string;
    history?: HistoryEntry[];
}

export function BaseGame ({ title, dashboard, status, controls, g1Title, g1Graph, g2Title, g2Graph, menuRoute, history }: BaseGameProps) {
    const navigate = useNavigate();
    const historyRef = useRef<HTMLDivElement>(null);

    // reacts to every change in history array
    // smoothly renders latest state
    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollIntoView({
                behavior: "smooth"
            });
        }
    }, [history]); // runs when there is a change in history

    return (
        <div className="w-full h-screen bg-slate-50 flex flex-col xl:flex-row overflow-hidden">
            {/* main part - game boards */}
            {/* POPRAWKA 1: overflow-y-auto i flex-col zamiast sztywnego justify-center */}
            <div className="flex-1 flex flex-col items-center p-4 xl:p-6 overflow-y-auto">
                {/* POPRAWKA 2: dodanie my-auto dla inteligentnego centrowania w pionie */}
                <div className="flex flex-col items-center gap-3 w-full max-w-5xl box-border my-auto">
                    <Subtitle className="text-3xl mb-1">{title}</Subtitle>
                    {/* panel with rounds, pebbles, score */}
                    <div className='flex flex-col items-center bg-white py-3 px-6 rounded-2xl w-full max-w-4xl shadow-md border-t-4 border-blue-500'>
                        {dashboard}
                    </div>

                    {/* additional controls, for example pebble choice menu */}
                    {controls}

                    {/* container for 2 graphs */}
                    <div className="flex flex-col md:flex-row gap-4 w-full max-w-6xl justify-center mt-2">
                        <div className="text-center w-full flex flex-col items-center">
                            <Subtitle className="mb-2 text-lg">{g1Title}</Subtitle>
                            {g1Graph}
                        </div>
                        <div className="text-center w-full flex flex-col items-center">
                            <Subtitle className="mb-2 text-lg">{g2Title}</Subtitle>
                            {g2Graph}
                        </div>
                    </div>

                    {/* lower panel with exit buttons */}
                    {/* POPRAWKA 3: dodanie mb-8 dla oddechu na samym dole scrolla */}
                    <div className="w-full max-w-md mt-3 mb-8">
                        {status === 'game_over' ? (
                            <Button
                                onClick={() => navigate(menuRoute)}
                                className="bg-gray-500 hover:bg-gray-600"
                            >
                                Back to menu / Play again
                            </Button>
                        ) : (
                            <Button
                                onClick={() => navigate("/")}
                                className="bg-gray-500 hover:bg-gray-600"
                            >
                                Exit game
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* right side - history panel that chooses entry style based on entry type */}
            {history && (
                <div className="w-full xl:w-[350px] shrink-0 flex flex-col bg-white border-l-2 border-gray-200 shadow-2xl h-[30vh] xl:h-screen">
                    <div className="bg-slate-100 border-b border-gray-200 p-4 font-bold text-gray-700 flex items-center justify-center shadow-sm z-10 uppercase tracking-wider text-sm">
                        📜 Game History
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
                        {history.map((entry) => (
                            <div key={entry.id} className={`p-3 rounded-lg text-sm shadow-sm border ${
                                entry.type === 'spoiler' ? 'bg-red-50 border-red-200 text-red-800' :
                                entry.type === 'duplicator' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                                entry.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 font-bold' :
                                entry.type === 'error' ? 'bg-red-100 border-red-300 text-red-900 font-bold' :
                                'bg-white border-gray-200 text-gray-600 italic'
                            }`}>
                                {entry.text}
                            </div>
                        ))}
                        <div ref={historyRef} />
                    </div>
                </div>
            )}
        </div>
    );
}