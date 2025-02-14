import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  SelectChangeEvent,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../features/menu/menuSlice";
import { RootState } from "../../features/store";
import { AppDispatch } from "../../features/store";
import { MenuItem as MenuItemType } from "../../types";
import { useNavigate } from "react-router-dom";

interface MenuItemFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  preparationTime: number;
  available: string;
}

const initialFormData: MenuItemFormData = {
  name: "",
  description: "",
  category: "",
  price: 0,
  preparationTime: 0,
  available: "true",
};

const categories = [
  "Appetizers",
  "Main Course",
  "Desserts",
  "Beverages",
  "Sides",
];

const Menu = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, isLoading } = useSelector((state: RootState) => state.menu);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItemType | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>(initialFormData);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchMenuItems());
  }, [dispatch]);

  useEffect(() => {
    // Get category from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    setSelectedCategory(category);
  }, []);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const handleOpen = () => {
    setFormData((prev) => ({
      ...initialFormData,
      category: selectedCategory || "",
    }));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    setFormData(initialFormData);
  };

  const handleEdit = (item: MenuItemType) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      preparationTime: item.preparationTime,
      available: item.available ? "true" : "false",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await dispatch(deleteMenuItem(id));
    }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const name = e.target.name;
    const value = e.target.value;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      available: formData.available === "true",
    };

    if (editItem) {
      await dispatch(
        updateMenuItem({
          id: editItem._id,
          data: submissionData as Partial<MenuItemType>,
        })
      );
    } else {
      await dispatch(createMenuItem(submissionData as Partial<MenuItemType>));
    }
    handleClose();
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          width: "100%",
          gap: 3,
        }}
      >
        <Typography variant="h4" sx={{ flex: "0 1 auto" }}>
          {selectedCategory ? `${selectedCategory} Menu Items` : "Menu Items"}
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flex: "0 0 auto",
            width: "auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/menu/categories")}
            sx={{ minWidth: 140, flex: "0 0 auto" }}
          >
            Manage Categories
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            disabled={isLoading}
            sx={{ minWidth: 120, flex: "0 0 auto" }}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {selectedCategory && (
        <Button
          variant="text"
          onClick={() => {
            setSelectedCategory(null);
            navigate("/menu");
          }}
          sx={{ mb: 2 }}
        >
          ← Back to All Items
        </Button>
      )}

      <Grid container spacing={3}>
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card>
              {item.image && (
                <CardMedia
                  component="img"
                  height="140"
                  image={item.image}
                  alt={item.name}
                />
              )}
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      {item.category}
                    </Typography>
                  </div>
                  <Typography variant="h6">£{item.price.toFixed(2)}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {item.description}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color={item.available ? "success.main" : "error.main"}
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(item)}
                      disabled={isLoading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item._id)}
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editItem ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleChange}
                required
                disabled={!!selectedCategory}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              required
              fullWidth
              type="number"
              label="Price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">£</InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type="number"
              label="Preparation Time (minutes)"
              name="preparationTime"
              value={formData.preparationTime}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Availability</InputLabel>
              <Select
                name="available"
                value={formData.available}
                label="Availability"
                onChange={handleChange}
              >
                <MenuItem value="true">Available</MenuItem>
                <MenuItem value="false">Unavailable</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? "Saving..." : editItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Menu;
