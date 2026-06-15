import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Title, Subtitle } from "../components/ui/Titles";

// root endpoint, routes the user to the specific game mode or instructions
function Menu() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 box-border gap-6">
            <Title className="text-center -mt-24">Graph Games</Title>

            <Card>
                <Subtitle className="mb-8">Which game do you want to play?</Subtitle>
                
                <div className="flex flex-col w-full gap-4">
                    <Button onClick={() => navigate('/ef-menu')}>
                        EF Game
                    </Button>
                    <Button onClick={() => navigate('/pebbles-menu')}>
                        Pebbles
                    </Button>
                    <Button disabled>
                        Rules
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default Menu;