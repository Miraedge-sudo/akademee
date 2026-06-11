const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, School } = require('../models');
const { secret, expiresIn } = require('../config/jwt');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, schoolId } = req.body;
    
    // Check if user already exists
    const existing = await User.findByEmail(email, schoolId);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      schoolId: schoolId || null,
    });

    const user = result[0];
    
    // Assign STUDENT role by default if school is specified, else SUPER_ADMIN
    const roleCode = schoolId ? 'STUDENT' : 'SUPER_ADMIN';
    const roleResult = await Role.findByCode(roleCode);
    
    if (roleResult.length > 0) {
      await User.assignRole(user.user_id, roleResult[0].role_id);
    }

    res.status(201).json({ 
      id: user.user_id, 
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, schoolId } = req.body;
    
    // Find user
    const users = await User.findByEmail(email, schoolId);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user roles
    const rolesResult = await User.getRoles(user.user_id);
    const roles = rolesResult.map(r => r.role_code);

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email,
        schoolId: user.school_id,
        roles,
      }, 
      secret, 
      { expiresIn }
    );

    res.json({ 
      token,
      user: {
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        roles,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userRecord = user[0];
    const roles = await User.getRoles(userRecord.user_id);

    res.json({
      userId: userRecord.user_id,
      firstName: userRecord.first_name,
      lastName: userRecord.last_name,
      email: userRecord.email,
      phone: userRecord.phone,
      avatarUrl: userRecord.avatar_url,
      roles: roles.map(r => r.role_code),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
