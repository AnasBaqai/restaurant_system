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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Fade,
  Grow,
  Slide,
  SelectChangeEvent,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { register } from "../../features/auth/authSlice";
import { RootState } from "../../features/store";
import { AppDispatch } from "../../features/store";
import { UserRole } from "../../types";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Restaurant as RestaurantIcon,
  Room as RoomIcon,
  Kitchen as KitchenIcon,
  SupervisorAccount as ManagerIcon,
  AdminPanelSettings as AdminIcon,
  Work as RoleIcon,
} from "@mui/icons-material";

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
  backgroundColor: "rgba(255, 255, 255, 1)",
  borderRadius: theme.spacing(2),
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  width: "100%",
  maxWidth: "400px",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: "linear-gradient(45deg, #8B4513, #D2691E)",
  },
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

const RoleCard = styled(Box)(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: "100%",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px) scale(1.02)",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  "& .MuiSvgIcon-root": {
    fontSize: "2rem",
    marginBottom: theme.spacing(1),
    color: theme.palette.secondary.light,
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

const StyledFormControl = styled(FormControl)(({ theme }) => ({
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
  background: "linear-gradient(45deg, #8B4513 30%, #D2691E 90%)",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[4],
    background: "linear-gradient(45deg, #654321 30%, #8B4513 90%)",
  },
}));

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.WAITER,
  });
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value as UserRole,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await dispatch(register(formData)).unwrap();
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
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <RestaurantIcon
                sx={{ fontSize: 40, color: "primary.main", mb: 2 }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                  textAlign: "center",
                }}
              >
                Restaurant Management
              </Typography>
            </Box>
          </Grow>
          <Typography
            variant="h5"
            sx={{ mb: 3, fontWeight: 500, color: "text.primary" }}
          >
            Create Account
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
            <Slide direction="right" in timeout={500}>
              <Box>
                <StyledTextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={formData.name}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Slide>
            <Slide direction="left" in timeout={700}>
              <Box>
                <StyledTextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Slide>
            <Slide direction="right" in timeout={900}>
              <Box>
                <StyledTextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Slide>
            <Slide direction="left" in timeout={1100}>
              <Box>
                <StyledFormControl fullWidth margin="normal">
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={handleRoleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <RoleIcon color="primary" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value={UserRole.WAITER}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <RoomIcon /> Waiter
                      </Box>
                    </MenuItem>
                    <MenuItem value={UserRole.CHEF}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <KitchenIcon /> Chef
                      </Box>
                    </MenuItem>
                    <MenuItem value={UserRole.MANAGER}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <ManagerIcon /> Manager
                      </Box>
                    </MenuItem>
                    <MenuItem value={UserRole.ADMIN}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AdminIcon /> Admin
                      </Box>
                    </MenuItem>
                  </Select>
                </StyledFormControl>
              </Box>
            </Slide>
            <AnimatedButton
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, fontSize: "1.1rem" }}
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </AnimatedButton>
            <Box sx={{ textAlign: "center" }}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{
                  textDecoration: "none",
                  color: "primary.main",
                  transition: "color 0.3s",
                  "&:hover": {
                    color: "primary.dark",
                  },
                }}
              >
                {"Already have an account? Sign In"}
              </Link>
            </Box>
          </Box>
        </StyledPaper>

        <RightPanel>
          <Fade in timeout={1000}>
            <Box>
              <Typography variant="h3" sx={{ mb: 4, fontWeight: 600 }}>
                Join Our Team
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Choose your role and start managing the restaurant efficiently
              </Typography>

              <Box sx={{ mt: 4 }}>
                <Slide direction="left" in timeout={600}>
                  <RoleCard>
                    <RoomIcon />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Waiter
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Take orders, manage tables, and provide excellent service
                    </Typography>
                  </RoleCard>
                </Slide>

                <Slide direction="left" in timeout={800}>
                  <RoleCard>
                    <KitchenIcon />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Chef
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Manage kitchen operations and track order preparation
                    </Typography>
                  </RoleCard>
                </Slide>

                <Slide direction="left" in timeout={1000}>
                  <RoleCard>
                    <ManagerIcon />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Manager
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Oversee operations, staff, and restaurant performance
                    </Typography>
                  </RoleCard>
                </Slide>

                <Slide direction="left" in timeout={1200}>
                  <RoleCard>
                    <AdminIcon />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Admin
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Full system control and configuration management
                    </Typography>
                  </RoleCard>
                </Slide>
              </Box>
            </Box>
          </Fade>
        </RightPanel>
      </ContentContainer>
    </BackgroundContainer>
  );
};

export default Register;
