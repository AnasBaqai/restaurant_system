import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../features/store";
import { fetchMenuItems } from "../../features/menu/menuSlice";

interface Category {
  name: string;
  itemCount: number;
}

const Categories = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items } = useSelector((state: RootState) => state.menu);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    dispatch(fetchMenuItems());
  }, [dispatch]);

  useEffect(() => {
    // Calculate categories and item counts
    const categoryMap = items.reduce((acc: { [key: string]: number }, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const categoryList = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      itemCount: count,
    }));

    setCategories(categoryList);
  }, [items]);

  const handleAddCategory = () => {
    setEditMode(false);
    setNewCategory("");
    setDialogOpen(true);
  };

  const handleEditCategory = (category: string) => {
    setEditMode(true);
    setNewCategory(category);
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleDeleteCategory = (category: string) => {
    if (
      window.confirm(`Are you sure you want to delete ${category} category?`)
    ) {
      // Here you would typically make an API call to delete the category
      // For now, we'll just update the local state
      setCategories(categories.filter((c) => c.name !== category));
    }
  };

  const handleSaveCategory = () => {
    if (!newCategory.trim()) return;

    if (editMode && selectedCategory) {
      // Update existing category
      setCategories(
        categories.map((c) =>
          c.name === selectedCategory ? { ...c, name: newCategory } : c
        )
      );
    } else {
      // Add new category
      setCategories([...categories, { name: newCategory, itemCount: 0 }]);
    }

    setDialogOpen(false);
    setNewCategory("");
    setSelectedCategory(null);
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/menu?category=${encodeURIComponent(category)}`);
  };

  return (
    <Box sx={{ p: 3 }}>
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
          Menu Categories
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
            onClick={() => navigate("/menu")}
            sx={{ minWidth: 120, flex: "0 0 auto" }}
          >
            View Menu
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCategory}
            sx={{ minWidth: 140, flex: "0 0 auto" }}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      <Paper>
        <List>
          {categories.map((category, index) => (
            <div key={category.name}>
              <ListItem onClick={() => handleCategoryClick(category.name)}>
                <ListItemText
                  primary={category.name}
                  secondary={`${category.itemCount} items`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category.name);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.name);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < categories.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editMode ? "Edit Category" : "Add New Category"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained">
            {editMode ? "Save Changes" : "Add Category"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;
