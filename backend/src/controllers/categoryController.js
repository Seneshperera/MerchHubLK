const prisma = require('../database/db');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createCategory = async (req, res) => {
  const { name, description } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const slug = slugify(name);

    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category with a similar name already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl
      }
    });

    return res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  try {
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const data = { description };
    if (name) {
      data.name = name;
      data.slug = slugify(name);
    }

    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data
    });

    return res.status(200).json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await prisma.category.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
