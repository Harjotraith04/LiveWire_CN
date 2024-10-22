import { useAppContext } from "@/context/AppContext";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socket";
import { USER_STATUS } from "@/types/user";
import { ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import logo from "@/assets/logo.jpg";

const FormComponent = () => {
  const location = useLocation();
  const { currentUser, setCurrentUser, status, setStatus } = useAppContext();
  const { socket } = useSocket();

  const usernameRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const createNewRoomId = () => {
    setCurrentUser({ ...currentUser, roomId: uuidv4() });
    toast.success("Created a new Room Id");
    usernameRef.current?.focus();
  };

  const handleInputChanges = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    setCurrentUser({ ...currentUser, [name]: value });
  };

  const validateForm = () => {
    if (currentUser.username.length === 0) {
      toast.error("Enter your username");
      return false;
    } else if (currentUser.roomId.length === 0) {
      toast.error("Enter a room id");
      return false;
    } else if (currentUser.roomId.length < 5) {
      toast.error("ROOM Id must be at least 5 characters long");
      return false;
    } else if (currentUser.username.length < 3) {
      toast.error("Username must be at least 3 characters long");
      return false;
    }
    return true;
  };

  const joinRoom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === USER_STATUS.ATTEMPTING_JOIN) return;
    if (!validateForm()) return;
    toast.loading("Joining room...");
    setStatus(USER_STATUS.ATTEMPTING_JOIN);
    socket.emit(SocketEvent.JOIN_REQUEST, currentUser);
  };

  useEffect(() => {
    if (currentUser.roomId.length > 0) return;
    if (location.state?.roomId) {
      setCurrentUser({ ...currentUser, roomId: location.state.roomId });
      if (currentUser.username.length === 0) {
        toast.success("Enter your username");
      }
    }
  }, [currentUser, location.state?.roomId, setCurrentUser]);

  useEffect(() => {
    if (status === USER_STATUS.DISCONNECTED && !socket.connected) {
      socket.connect();
      return;
    }

    const isRedirect = sessionStorage.getItem("redirect") || false;

    if (status === USER_STATUS.JOINED && !isRedirect) {
      const username = currentUser.username;
      sessionStorage.setItem("redirect", "true");
      navigate(`/editor/${currentUser.roomId}`, {
        state: {
          username,
        },
      });
    } else if (status === USER_STATUS.JOINED && isRedirect) {
      sessionStorage.removeItem("redirect");
      setStatus(USER_STATUS.DISCONNECTED);
      socket.disconnect();
      socket.connect();
    }
  }, [currentUser, location.state?.redirect, navigate, setStatus, socket, status]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col">
      {/* Title Section */}
      <div className="text-center pt-8">
        <h1 className="text-4xl font-extrabold mb-2 text-green-400">
          Computer Network Project
        </h1>
        <p className="text-lg font-medium">
          Made by: <br />
          Harjot Singh Raith (A068) <br />
          Kartikeya Mudliyar (A072)
        </p>
      </div>

      {/* Flex container for centering the form */}
      <div className="flex flex-grow items-center justify-center">
        <div className="w-full max-w-[400px] p-8 bg-gray-800 rounded-2xl shadow-2xl mt-[-20px]">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={logo}
              alt="Logo"
              className="object-contain rounded-full"
              style={{ width: "150px" }}
            />
          </div>

          {/* Form Section */}
          <form onSubmit={joinRoom} className="flex flex-col gap-5">
            <input
              type="text"
              name="roomId"
              placeholder="Room ID"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              onChange={handleInputChanges}
              value={currentUser.roomId}
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              onChange={handleInputChanges}
              value={currentUser.username}
              ref={usernameRef}
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-green-500 hover:bg-green-400 transition-all duration-300 px-8 py-3 text-lg font-semibold text-white shadow-md"
            >
              Join
            </button>
          </form>

          {/* Generate Room ID Button */}
          <button
            className="mt-4 cursor-pointer select-none underline text-green-300 hover:text-green-200"
            onClick={createNewRoomId}
          >
            Generate Unique Room ID
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormComponent;
