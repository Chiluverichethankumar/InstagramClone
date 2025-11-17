from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Supports models with 'user' or 'sender' fields
        owner = getattr(obj, 'user', None) or getattr(obj, 'sender', None)
        return owner == request.user