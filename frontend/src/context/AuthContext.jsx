import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const AuthContext = createContext(null);

//this part will make the authentication data ad wraps the app tree
//it will be accessible by any child component through the react context
export const AuthProvider = ({children}) => {
  //store thee authenticated user profile object ({id, email, role})
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  //store the raw JWT string that is returned by the backend API
  const [loading, setLoading] = useState(true);

    useEffect(() => {

        const savedToken =
            sessionStorage.getItem("token");

        const savedUser =
            sessionStorage.getItem("user");


        if (savedToken && savedUser) {

            try {

                setToken(savedToken);

                setUser(
                    JSON.parse(savedUser)
                );

            }
            catch (error) {

                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
            }
        }


        setLoading(false);

    }, []);


    const login = (
        newToken,
        userData
    ) => {

        setToken(newToken);
        setUser(userData);

        sessionStorage.setItem(
            "token",
            newToken
        );

        sessionStorage.setItem(
            "user",
            JSON.stringify(userData)
        );
    };


    const logout = () => {

        setToken(null);
        setUser(null);

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
    };


    const value = {
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
        loading
    };


    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {

    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used within an AuthProvider"
        );
    }

    return context;
};