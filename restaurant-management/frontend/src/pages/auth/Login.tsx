import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
  Fade,
  Grow,
  Slide,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { login } from "../../features/auth/authSlice";
import { RootState } from "../../features/store";
import { AppDispatch } from "../../features/store";

const BackgroundContainer = styled(Box)({
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  alignItems: "center",
  background:
    "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/restaurant-bg.webp')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  overflow: "hidden",
});

const ContentContainer = styled(Container)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "2rem",
  width: "100%",
  height: "100%",
  maxWidth: "100% !important",
  padding: "2rem 4rem",
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backdropFilter: "blur(10px)",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  borderRadius: theme.spacing(2),
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  width: "100%",
  maxWidth: "400px",
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  color: "white",
  padding: theme.spacing(4),
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const FeatureItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(3),
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backdropFilter: "blur(5px)",
  width: "100%",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "translateX(10px)",
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  transition: "transform 0.2s",
  "&:hover": {
    transform: "scale(1.02)",
  },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[4],
  },
}));

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await dispatch(login(formData)).unwrap();
      if (result) {
        navigate("/");
      }
    } catch {
      // Error is handled by the auth slice
    }
  };

  return (
    <BackgroundContainer>
      <ContentContainer maxWidth="lg">
        <StyledPaper elevation={6}>
          <Grow in timeout={800}>
            <Typography
              variant="h4"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "primary.main",
                textAlign: "center",
              }}
            >
              Restaurant Management
            </Typography>
          </Grow>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
            Welcome Back
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            {error && (
              <Fade in timeout={500}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              </Fade>
            )}
            <StyledTextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <StyledTextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <AnimatedButton
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, fontSize: "1.1rem" }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </AnimatedButton>
            <Box sx={{ textAlign: "center" }}>
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                sx={{
                  textDecoration: "none",
                  transition: "color 0.3s",
                  "&:hover": {
                    color: "primary.main",
                  },
                }}
              >
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </StyledPaper>

        <RightPanel>
          <Fade in timeout={1000}>
            <Box>
              <Typography variant="h3" sx={{ mb: 4, fontWeight: 600 }}>
                Streamline Your Restaurant Operations
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                An all-in-one solution for modern restaurant management
              </Typography>

              <Box sx={{ mt: 4 }}>
                <Slide direction="left" in timeout={600}>
                  <FeatureItem>
                    <Typography variant="h6">
                      🍽️ Real-time Table Management
                    </Typography>
                  </FeatureItem>
                </Slide>

                <Slide direction="left" in timeout={800}>
                  <FeatureItem>
                    <Typography variant="h6">
                      📱 Digital Menu & Order Processing
                    </Typography>
                  </FeatureItem>
                </Slide>

                <Slide direction="left" in timeout={1000}>
                  <FeatureItem>
                    <Typography variant="h6">
                      💳 Seamless Payment Integration
                    </Typography>
                  </FeatureItem>
                </Slide>

                <Slide direction="left" in timeout={1200}>
                  <FeatureItem>
                    <Typography variant="h6">
                      📊 Advanced Analytics & Reports
                    </Typography>
                  </FeatureItem>
                </Slide>
              </Box>
            </Box>
          </Fade>
        </RightPanel>
      </ContentContainer>
    </BackgroundContainer>
  );
};

export default Login;
