from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from coaching.models import (
    User, Batch, StudentProfile, AttendanceRecord, FeePayment, ClassSchedule,
    DailyBatchAttendanceLock, Subject, AssignmentCorrection, ClassroomMovementLog,
    TeacherAttendanceRecord, PeriodSchedule
)

# Extend default UserAdmin to support role field editing
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = UserAdmin.fieldsets + (
        ('Role Parameters', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Parameters', {'fields': ('role',)}),
    )

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'timing', 'created_at')
    search_fields = ('name', 'description')

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user_fullname', 'user', 'batch', 'total_fee', 'total_paid', 'remaining_balance', 'fee_status')
    list_filter = ('batch', 'next_due_date')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'school_college')

    def user_fullname(self, obj):
        return obj.user.get_full_name()
    user_fullname.short_description = 'Student Full Name'

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'time_in', 'status', 'minutes_late', 'marked_by')
    list_filter = ('date', 'status', 'marked_by')
    search_fields = ('student__user__username', 'student__user__first_name', 'student__user__last_name')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'teacher')
    search_fields = ('name', 'code')

@admin.register(AssignmentCorrection)
class AssignmentCorrectionAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'work_type', 'title', 'marks_obtained', 'max_marks', 'status', 'teacher')
    list_filter = ('work_type', 'status', 'subject')

@admin.register(ClassroomMovementLog)
class ClassroomMovementLogAdmin(admin.ModelAdmin):
    list_display = ('student', 'movement_type', 'subject', 'reason', 'timestamp', 'teacher')
    list_filter = ('movement_type', 'timestamp', 'subject')

@admin.register(TeacherAttendanceRecord)
class TeacherAttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'date', 'time_in', 'time_out', 'status')
    list_filter = ('date', 'status')

@admin.register(PeriodSchedule)
class PeriodScheduleAdmin(admin.ModelAdmin):
    list_display = ('section', 'period_name', 'subject', 'teacher', 'start_time', 'end_time')
    list_filter = ('section', 'subject', 'teacher')

@admin.register(DailyBatchAttendanceLock)
class DailyBatchAttendanceLockAdmin(admin.ModelAdmin):
    list_display = ('batch', 'date', 'is_locked', 'locked_at', 'locked_by')
    list_filter = ('date', 'is_locked', 'batch')

@admin.register(FeePayment)
class FeePaymentAdmin(admin.ModelAdmin):
    list_display = ('student', 'amount_paid', 'payment_date', 'collected_by')
    list_filter = ('payment_date', 'collected_by')

@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = ('batch', 'title', 'date', 'start_time', 'end_time', 'is_holiday')

admin.site.has_permission = lambda request: request.user.is_active and request.user.is_superuser
