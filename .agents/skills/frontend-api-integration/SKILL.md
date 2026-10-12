---
name: frontend-api-integration
description: Standard runbook and architecture for inspecting backend NestJS APIs (Controllers, DTOs, Routes, Interceptors) and seamlessly implementing end-to-end frontend integrations in React / Vite / Bootstrap / Formik / Yup / Zustand. Activates whenever the user provides a backend controller API snippet or asks to implement/integrate a backend API on the frontend ('ye backend api frontend par lagao', 'implement this api on frontend', 'api frontend par integrate kardo', 'form validation aur api service bana do', etc.). Automatically maps API endpoints, service layer, Yup validation schema from DTOs, Formik forms, Zustand stores, DataTable listings, and Toast notifications.
---
# Frontend API Integration Skill

## Purpose

This skill establishes the standardized end-to-end protocol for taking any backend NestJS API (Controller method, DTO, Interceptor, Route) and implementing its full frontend counterpart in the React (`client/`) codebase.

Whenever the user provides a backend controller API snippet or asks to connect a backend API to the frontend:

- *"ye backend api frontend par lagado"*
- *"implement this api on frontend"*
- *"backend ki api do wo implement kardey frontend par"*
- *"user list / create / update / delete / login api connect kardo"*

**Follow this skill strictly.**

---

## Complete Integration Flow Overview

```
[Backend Controller API & DTO]
       │
       ▼
1. Inspect Backend Details
   ├── Route prefix & method (e.g. @Controller('auth') + @Post('/admin-login') -> 'auth/admin-login')
   ├── DTO Fields & Validation rules (@IsEmail, @IsNotEmpty, @MinLength, etc.)
   ├── Multer / Interceptor type (JSON payload vs FormData)
   └── Response structure (ResponseHelper.success data & message)
       │
       ▼
2. Frontend apiEndpoints.js (`client/src/services/apiEndpoints.js`)
   └── Export constant under API_ENDPOINTS.<MODULE>.<ACTION>
       │
       ▼
3. Frontend Service Layer (`client/src/services/<module>Service.js`)
   └── Standard Axios call via `api.js` with structured try/catch and error formatting
       │
       ▼
4. Frontend Validation Schema (`client/src/validations/<module>Validation.js`)
   └── Exact Yup schema matching backend DTO constraints & messages
       │
       ▼
5. State Management (`client/src/store/<module>Store.js`) [If Applicable]
   └── Zustand store actions (e.g., auth tokens, user state, global cached data)
       │
       ▼
6. Frontend Page / Component Integration (`client/src/pages/...`)
   ├── Form Submissions: Formik + AppTextField / AppPasswordField + Toast feedback
   ├── Paginated Listings: DataTableWrapper + pagination state + filter handling
   └── Modals & Actions: Add/Edit/Delete modals + list refresh
       │
       ▼
7. Routing (`client/src/routes/AppRoutes.jsx`) [If New Page]
   └── Register route under PublicRoute or PrivateRoute + MainLayout
```

---

## Step-by-Step Implementation Guide

### Phase 1: Backend API Inspection

Before writing frontend code, inspect the backend files to extract the exact requirements:

1. **Route URL & Method**:

   - Check controller decorator: `@Controller('auth')` or `@Controller('users')`
   - Check method decorator: `@Post('/admin-login')`, `@Get('/all')`, `@Post('/paginated')`, `@Patch('/:id')`, `@Delete('/:id')`
   - Resulting endpoint: `auth/admin-login`, `users/paginated`, etc.
2. **Payload Type**:

   - If `@UseInterceptors(FileInterceptor('file'))` or has file uploads: Frontend MUST send `FormData`.
   - If standard JSON or `@UseInterceptors(FileInterceptor(''))` without files: Standard JSON object payload.
3. **DTO Fields & Validations**:

   - Find the DTO file referenced in `@Body() dto: ExampleDto`.
   - Map validation decorators to Yup:
     - `@IsNotEmpty()` / `@IsDefined()` ➔ `.required('Field is required')`
     - `@IsEmail()` ➔ `.email('Invalid email address').required('Required')`
     - `@MinLength(n)` ➔ `.min(n, 'Must be at least n characters')`
     - `@MaxLength(n)` ➔ `.max(n, 'Must be at most n characters')`
     - `@IsOptional()` ➔ Optional field (not required)
     - `@IsNumber()` / `@IsInt()` ➔ `Yup.number()`
     - `@IsEnum(Enum)` ➔ `Yup.string().oneOf(Object.values(Enum))`
     - `@Matches(regex)` ➔ `Yup.string().matches(regex, 'Custom message')`
4. **Response Structure**:

   - Backend uses `ResponseHelper.success({ res, data, message })`.
   - Axios receives `{ data: { data: ..., message: '...' } }`.
   - Errors are thrown as `{ message: [...] }` or `{ message: '...' }`.

---

### Phase 2: Register API Endpoints (`client/src/services/apiEndpoints.js`)

Add or update the module endpoints in `client/src/services/apiEndpoints.js`:

```javascript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "auth/admin-login",
    REGISTER: "auth/register",
  },
  USERS: {
    PAGINATED: "users/paginated",
    CREATE: "users/create",
    GET_BY_ID: (id) => `users/${id}`,
    UPDATE: (id) => `users/update/${id}`,
    DELETE: (id) => `users/delete/${id}`,
  },
  // Add new module endpoints here
};
```

---

### Phase 3: Service Layer Implementation (`client/src/services/<module>Service.js`)

Create or update the service file using the shared Axios instance `api.js`:

#### A. Standard Action / Form Service (e.g. Login, Create, Update)

```javascript
import api from "./api";
import { API_ENDPOINTS } from "./apiEndpoints";

export const authService = {
  login: async (payload) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
      return {
        success: true,
        data: response?.data?.data,
        message: response?.data?.message || "Success",
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message?.[0] ||
        error.response?.data?.message ||
        "An error occurred. Please try again.";
      throw { success: false, data: null, message: errorMsg };
    }
  },
};
```

#### B. Paginated Listing Service (with query params & filters)

```javascript
export const userService = {
  getPaginatedUsers: async (page = 1, limit = 10, filters = {}) => {
    try {
      const response = await api.post(API_ENDPOINTS.USERS.PAGINATED, filters, {
        params: { page, limit },
      });
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message,
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message?.[0] ||
        error.response?.data?.message ||
        "An error occurred while fetching users.";
      throw { success: false, data: null, message: errorMsg };
    }
  },
};
```

#### C. File Upload / FormData Service

```javascript
export const ringtoneService = {
  createRingtone: async (formData) => {
    try {
      const response = await api.post(API_ENDPOINTS.RINGTONES.CREATE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return {
        success: true,
        data: response?.data?.data,
        message: response?.data?.message || "Created successfully",
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message?.[0] ||
        error.response?.data?.message ||
        "Failed to upload ringtone.";
      throw { success: false, data: null, message: errorMsg };
    }
  },
};
```

---

### Phase 4: Form Validation Schema (`client/src/validations/<module>Validation.js`)

Create a Yup schema in `client/src/validations/` that mirrors backend DTO rules:

```javascript
import * as Yup from "yup";

export const loginValidationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export const userCreateValidationSchema = Yup.object({
  first_name: Yup.string().required("First name is required"),
  last_name: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().optional(),
});
```

---

### Phase 5: State Management Integration (`client/src/store/<module>Store.js`)

If the API involves shared/global state (e.g. Authentication, current user, active filters), update the Zustand store:

```javascript
import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,

  login: ({ user, token }) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
```

---

### Phase 6: Frontend UI Components / Pages

#### Pattern 1: Formik Form Integration (e.g., Login / Add / Edit)

Use `Formik`, `Row`, `Col`, custom form inputs (`AppTextField`, `AppPasswordField`), and `react-toastify`:

```jsx
import { Formik } from "formik";
import { Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppPasswordField from "../../components/forms/AppPasswordField";
import AppTextField from "../../components/forms/AppTextField";
import CustomButton from "../../components/common/CustomButton";
import { authService } from "../../services/authService";
import useAuthStore from "../../store/authStore";
import { loginValidationSchema } from "../../validations/loginValidation";

const Login = () => {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLoginSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = await authService.login({
        email: values.email,
        password: values.password,
      });

      const token = payload?.data?.token;
      const user = payload?.data?.user_details;

      if (token && user && payload?.success) {
        login({ user, token });
        toast.success(payload.message || "Login Successfully!");
        navigate("/dashboard");
      } else {
        toast.error("Login Failed!");
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={loginValidationSchema}
      onSubmit={handleLoginSubmit}
    >
      {({ values, handleSubmit, isSubmitting }) => (
        <form onSubmit={handleSubmit}>
          <Row>
            <Col md={12} className="mb-4">
              <AppTextField
                label="Email Address"
                placeholder="name@company.com"
                name="email"
                value={values.email}
              />
            </Col>
            <Col md={12} className="mb-4">
              <AppPasswordField
                label="Password"
                placeholder="Enter your password"
                name="password"
                value={values.password}
              />
            </Col>
            <Col md={12}>
              <CustomButton
                type="submit"
                disabled={isSubmitting}
                className="w-100"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </CustomButton>
            </Col>
          </Row>
        </form>
      )}
    </Formik>
  );
};

export default Login;
```

#### Pattern 2: Paginated DataTable Integration (`DataTableWrapper`)

For listing APIs with pagination and filters:

```jsx
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import DataTableWrapper from "../../components/common/DataTable/DataTableWrapper";
import UserInfo from "../../components/common/UserInfo";
import { userService } from "../../services/userService";

const UserList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setTimeout(() => {
        if (isMounted) setLoading(true);
      }, 0);

      try {
        const response = await userService.getPaginatedUsers(
          currentPage,
          perPage,
          searchFilters
        );
        if (response.success && isMounted) {
          const resData = response.data || {};
          const resultsArray = resData.results || resData.data?.results || [];
          const totalCount = resData.total || resData.data?.total || 0;

          setData(Array.isArray(resultsArray) ? resultsArray : []);
          setTotalRows(totalCount);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [currentPage, perPage, searchFilters]);

  const columns = [
    {
      name: "User Details",
      cell: (row) => (
        <UserInfo
          name={`${row.first_name || ""} ${row.last_name || ""}`.trim()}
          email={row.email}
          avatarUrl={row.profile_image}
        />
      ),
    },
    {
      name: "Role",
      cell: (row) => (
        <span className={`role-badge role-${row.role?.toLowerCase()}`}>
          {row.role}
        </span>
      ),
      tableColumn: true,
      filterName: "Role",
      filterType: "text",
    },
  ];

  return (
    <div className="users-page">
      <Container fluid>
        <DataTableWrapper
          columns={columns}
          data={data}
          loading={loading}
          totalRows={totalRows}
          perPage={perPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPerRowsChange={(newPerPage, page) => {
            setPerPage(newPerPage);
            setCurrentPage(page);
          }}
          onFilterChange={(filters) => {
            setSearchFilters(filters);
            setCurrentPage(1);
          }}
        />
      </Container>
    </div>
  );
};

export default UserList;
```

---

### Phase 7: Routes Registration (`client/src/routes/AppRoutes.jsx`)

When creating a new page or view, register it in `AppRoutes.jsx`:

- **Public Route** (Login, Register, Forgot Password):

  ```jsx
  <Route element={<PublicRoute />}>
    <Route path="/login" element={<Login />} />
  </Route>
  ```
- **Protected / Private Route** (Dashboard, Users, Trips, etc.):

  ```jsx
  <Route element={<PrivateRoute />}>
    <Route element={<MainLayout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/users" element={<UserList />} />
      <Route path="/<entity>" element={<EntityList />} />
    </Route>
  </Route>
  ```

---

## Critical Rules & Quality Checklist

1. **Auto-Inspection Rule**: Always check the backend controller and DTO to verify route paths, exact parameter names, and validation constraints. Do NOT guess field names.
2. **Standardized Error Handling**: In every service function, always catch `error.response?.data?.message?.[0] || error.response?.data?.message` and throw a structured error object.
3. **Formik & Yup Sync**: Every Formik field `name="..."` must exactly match the Yup schema key and the backend DTO property name.
4. **Loading & Submitting States**: Form submit buttons must use `isSubmitting` / `disabled={isSubmitting}` and show `"Submitting..."` or `"Saving..."`.
5. **Toast Notifications**: Use `toast.success()` for successful operations and `toast.error(error.message)` on errors.
6. **No Silent Swallowing**: Never suppress API errors silently; always display feedback to the user via toast.
