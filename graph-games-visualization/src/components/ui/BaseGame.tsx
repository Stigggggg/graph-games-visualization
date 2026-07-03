import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { Subtitle } from "./Titles";

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
}

export function BaseGame ({ title, dashboard, status, controls, g1Title, g1Graph, g2Title, g2Graph, menuRoute }: BaseGameProps) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center gap-4 py-4 px-2 h-screen overflow-hidden box-border">
            <Subtitle className="text-4xl">{title}</Subtitle>

            <div className='flex flex-col items-center bg-white py-6 px-8 rounded-2xl w-full max-w-4xl shadow-md border-t-4 border-blue-500'>
                {dashboard}
            </div>

           {controls}

           <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl justify-center mt-4">
                <div className="text-center w-full flex flex-col items-center">
                    <Subtitle className="mb-2">{g1Title}</Subtitle>
                    {g1Graph}
                </div>
                <div className="text-center w-full flex flex-col items-center">
                    <Subtitle className="mb-2">{g2Title}</Subtitle>
                    {g2Graph}
                </div>
           </div>

           <div className="w-full max-w-md mt-6">
                {status === 'game_over' ? (
                    <Button
                        onClick={() => navigate(menuRoute)}
                        className="bg-gray-500 hover:bg-gray-600"
                    >
                        Back to menu / Play again
                    </Button>
                ): (
                    <Button
                        onClick={() => navigate("/")}
                        className="bg-gray-500 hover:bg-gray-600"
                    >
                        Exit game
                    </Button>  
                )}
           </div>
        </div>
    );
}