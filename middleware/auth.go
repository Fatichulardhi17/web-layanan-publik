package middleware

import (
	"net/http"
	"strings"
	"time"

	"sakalputung/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims klaim payload token autentikasi
type JWTClaims struct {
	UserID uuid.UUID       `json:"user_id"`
	Role   models.UserRole `json:"role"`
	RT     *int            `json:"rt,omitempty"`
	Email  string          `json:"email"`
	jwt.RegisteredClaims
}

// GenerateToken membuat token JWT untuk user
func GenerateToken(userID uuid.UUID, role models.UserRole, rt *int, email string, secretKey string) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Role:   role,
		RT:     rt,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * 7 * time.Hour)), // Berlaku 7 hari
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "sakalputung-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

// AuthMiddleware memverifikasi bearer token JWT dari header Authorization
func AuthMiddleware(secretKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Header otorisasi diperlukan (Bearer token)"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format header otorisasi harus 'Bearer <token>'"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &JWTClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(secretKey), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau telah kadaluarsa"})
			c.Abort()
			return
		}

		// Simpan data user ke context gin
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Set("rt", claims.RT)
		c.Set("email", claims.Email)

		c.Next()
	}
}

// RequireRole memeriksa apakah user memiliki salah satu role yang diizinkan
func RequireRole(allowedRoles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Data otorisasi tidak ditemukan"})
			c.Abort()
			return
		}

		userRole := roleVal.(models.UserRole)
		for _, role := range allowedRoles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak memiliki wewenang untuk fitur ini"})
		c.Abort()
	}
}

// GetCurrentUserID mengambil ID user dari context Gin
func GetCurrentUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

// GetCurrentUserRole mengambil Role user dari context Gin
func GetCurrentUserRole(c *gin.Context) (models.UserRole, bool) {
	val, exists := c.Get("role")
	if !exists {
		return "", false
	}
	role, ok := val.(models.UserRole)
	return role, ok
}

// GetCurrentUserRT mengambil RT admin/user dari context Gin
func GetCurrentUserRT(c *gin.Context) *int {
	val, exists := c.Get("rt")
	if !exists || val == nil {
		return nil
	}
	rt, ok := val.(*int)
	if ok {
		return rt
	}
	return nil
}
