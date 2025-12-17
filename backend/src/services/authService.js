const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-prod';
const JWT_EXPIRES_IN = '7d';

/**
 * Hash a password securely
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 */
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token
 */
const generateToken = (userId, email) => {
    return jwt.sign(
        { id: userId, email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Verify a JWT token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Register a new user
 */
const registerUser = async (supabase, { email, password, firstName, lastName }) => {
    // 1. Check if user already exists
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        throw new Error('Email already registered');
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // 3. Create user in DB
    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName
        })
        .select()
        .single();

    if (error) throw error;

    // 4. Generate token
    const token = generateToken(newUser.id, newUser.email);

    return { user: newUser, token };
};

/**
 * Login a user
 */
const loginUser = async (supabase, { email, password }) => {
    // 1. Find user
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        throw new Error('Invalid credentials');
    }

    // 2. Compare password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // 3. Generate token
    const token = generateToken(user.id, user.email);

    return { user, token };
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    registerUser,
    loginUser
};
