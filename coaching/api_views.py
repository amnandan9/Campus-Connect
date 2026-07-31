import json
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q, Avg
from coaching.models import (
    User, StudentProfile, Subject, AssignmentCorrection,
    AttendanceRecord, FeePayment, Batch, ClassroomMovementLog
)
from coaching.api_auth import require_voice_api_key


@csrf_exempt
@require_voice_api_key
def voice_get_student(request):
    """
    GET /api/v1/voice/student/?query=Rahul
    Returns student profile details, section name, and financial balance.
    """
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    query = request.GET.get('query', '').strip() or request.GET.get('name', '').strip()
    if not query:
        return JsonResponse({'success': False, 'error': 'Missing required query parameter (name or username)'}, status=400)

    profile = StudentProfile.objects.filter(
        Q(user__first_name__icontains=query) |
        Q(user__last_name__icontains=query) |
        Q(user__username__icontains=query) |
        Q(qr_code_token=query)
    ).select_related('user', 'batch').first()

    if not profile:
        return JsonResponse({'success': False, 'error': f"Student '{query}' not found"}, status=404)

    return JsonResponse({
        'success': True,
        'student_id': profile.id,
        'full_name': profile.user.get_full_name(),
        'username': profile.user.username,
        'class_std': profile.class_std or 'N/A',
        'school': profile.school_college or 'N/A',
        'section': profile.batch.name if profile.batch else 'Unassigned',
        'parent_contact': profile.parent_contact or 'N/A',
        'total_fee': float(profile.total_fee),
        'total_paid': float(profile.total_paid),
        'remaining_balance': float(profile.remaining_balance),
        'fee_status': profile.fee_status,
    })


@csrf_exempt
@require_voice_api_key
def voice_update_marks(request):
    """
    POST /api/v1/voice/marks/
    Payload: {"student_name": "Rahul", "subject": "Maths", "marks_obtained": 35, "max_marks": 100, "work_type": "test", "remarks": "Needs improvement"}
    Updates marks and checks if score is below performance threshold (40%).
    If below threshold, parent_call_required is set to True.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        student_query = data.get('student_name', '').strip() or data.get('username', '').strip()
        subject_query = data.get('subject', '').strip()
        marks_obtained = float(data.get('marks_obtained', 0.0))
        max_marks = float(data.get('max_marks', 100.0))
        work_type = data.get('work_type', 'test')
        title = data.get('title', f"{subject_query or 'Academic'} Assessment")
        remarks = data.get('remarks', '')

        if not student_query:
            return JsonResponse({'success': False, 'error': 'Missing student_name parameter'}, status=400)

        profile = StudentProfile.objects.filter(
            Q(user__first_name__icontains=student_query) |
            Q(user__last_name__icontains=student_query) |
            Q(user__username__icontains=student_query)
        ).select_related('user', 'batch').first()

        teacher_username = data.get('teacher_username', '').strip()
        if request.user.is_authenticated and request.user.role == 'teacher':
            teacher_user = request.user
        elif teacher_username:
            teacher_user = User.objects.filter(username=teacher_username, role='teacher').first()
        else:
            teacher_user = None

        if teacher_user and teacher_user.role == 'teacher':
            assigned_batches = list(teacher_user.assigned_batches.values_list('id', flat=True))
            if profile.batch and profile.batch.id not in assigned_batches:
                return JsonResponse({
                    'success': False,
                    'error': 'Permission Denied',
                    'message': f"Teacher {teacher_user.get_full_name()} is only authorized to manage students in assigned Section ({', '.join(teacher_user.assigned_batches.values_list('name', flat=True))})."
                }, status=403)

        subject = None
        if subject_query:
            subject = Subject.objects.filter(
                Q(name__icontains=subject_query) | Q(code__icontains=subject_query)
            ).first()
            if not subject:
                subject, _ = Subject.objects.get_or_create(name=subject_query.title())

        correction = AssignmentCorrection.objects.create(
            student=profile,
            subject=subject,
            work_type=work_type,
            title=title,
            marks_obtained=marks_obtained,
            max_marks=max_marks,
            status='verified',
            teacher_remarks=remarks,
            verified_at=timezone.now()
        )


        pct = (marks_obtained / max_marks * 100.0) if max_marks > 0 else 0.0
        parent_call_required = (pct < 40.0)

        call_script = ""
        if parent_call_required:
            call_script = f"Alert: {profile.user.get_full_name()} scored {marks_obtained}/{max_marks} ({pct:.1f}%) in {subject.name if subject else 'recent assessment'}, which is below the 40% threshold. Initiating parent outreach call to {profile.parent_contact}."

        return JsonResponse({
            'success': True,
            'message': "The student's marks have been updated successfully.",
            'correction_id': correction.id,
            'student_name': profile.user.get_full_name(),
            'subject': subject.name if subject else subject_query,
            'marks_obtained': marks_obtained,
            'max_marks': max_marks,
            'percentage': round(pct, 2),
            'parent_call_required': parent_call_required,
            'parent_contact': profile.parent_contact,
            'call_script': call_script
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@require_voice_api_key
def voice_update_attendance(request):
    """
    POST /api/v1/voice/attendance/
    Payload: {"student_name": "Alice", "status": "present" / "absent" / "late", "date": "YYYY-MM-DD"}
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        student_query = data.get('student_name', '').strip()
        status_val = data.get('status', 'present').lower()
        date_str = data.get('date')

        if date_str:
            target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            target_date = timezone.localdate()

        profile = StudentProfile.objects.filter(
            Q(user__first_name__icontains=student_query) |
            Q(user__last_name__icontains=student_query) |
            Q(user__username__icontains=student_query)
        ).first()

        if not profile:
            return JsonResponse({'success': False, 'error': f"Student '{student_query}' not found"}, status=404)

        teacher_username = data.get('teacher_username', '').strip()
        if request.user.is_authenticated and request.user.role == 'teacher':
            teacher_user = request.user
        elif teacher_username:
            teacher_user = User.objects.filter(username=teacher_username, role='teacher').first()
        else:
            teacher_user = None

        if teacher_user and teacher_user.role == 'teacher':
            assigned_batches = list(teacher_user.assigned_batches.values_list('id', flat=True))
            if profile.batch and profile.batch.id not in assigned_batches:
                return JsonResponse({
                    'success': False,
                    'error': 'Permission Denied',
                    'message': f"Teacher {teacher_user.get_full_name()} is only authorized to mark attendance for students in assigned Section."
                }, status=403)


        if status_val == 'absent':
            AttendanceRecord.objects.filter(student=profile, date=target_date).delete()
            status_msg = f"Marked {profile.user.get_full_name()} as Absent for {target_date.strftime('%d-%m-%Y')}."
            rec_status = 'absent'
        else:
            rec, created = AttendanceRecord.objects.get_or_create(
                student=profile,
                date=target_date,
                defaults={'status': status_val, 'marked_by': 'voice_agent'}
            )
            if not created:
                rec.status = status_val
                rec.marked_by = 'voice_agent'
                rec.save()
            status_msg = f"Marked {profile.user.get_full_name()} as {status_val.capitalize()} for {target_date.strftime('%d-%m-%Y')}."
            rec_status = rec.status

        return JsonResponse({
            'success': True,
            'message': status_msg,
            'student_name': profile.user.get_full_name(),
            'status': rec_status,
            'date': target_date.strftime('%Y-%m-%d')
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@require_voice_api_key
def voice_get_parent_contact(request):
    """
    GET /api/v1/voice/parent/?name=Rahul
    Returns parent contact information and student academic performance summary.
    """
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    query = request.GET.get('query', '').strip() or request.GET.get('name', '').strip()
    profile = StudentProfile.objects.filter(
        Q(user__first_name__icontains=query) |
        Q(user__last_name__icontains=query) |
        Q(user__username__icontains=query)
    ).select_related('user', 'batch').first()

    if not profile:
        return JsonResponse({'success': False, 'error': f"Student '{query}' not found"}, status=404)

    recent_marks = AssignmentCorrection.objects.filter(student=profile).order_by('-verified_at')[:3]
    marks_summary = [
        {
            'subject': m.subject.name if m.subject else 'General',
            'title': m.title,
            'score': f"{m.marks_obtained}/{m.max_marks}" if m.marks_obtained is not None else "Pending",
            'date': m.verified_at.strftime('%d-%m-%Y')
        }
        for m in recent_marks
    ]

    return JsonResponse({
        'success': True,
        'student_name': profile.user.get_full_name(),
        'section': profile.batch.name if profile.batch else 'Unassigned',
        'parent_contact': profile.parent_contact or 'N/A',
        'recent_marks': marks_summary,
        'remaining_balance': float(profile.remaining_balance),
        'fee_status': profile.fee_status
    })


@csrf_exempt
@require_voice_api_key
def voice_create_notification(request):
    """
    POST /api/v1/voice/notification/
    Payload: {"student_name": "Rahul", "title": "Academic Alert", "message": "Parent called regarding Math test score."}
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        student_query = data.get('student_name', '').strip()
        title = data.get('title', 'Voice Agent Alert')
        message = data.get('message', '')

        profile = StudentProfile.objects.filter(
            Q(user__first_name__icontains=student_query) |
            Q(user__last_name__icontains=student_query) |
            Q(user__username__icontains=student_query)
        ).first()

        if profile:
            profile.individual_note = f"[{timezone.localdate().strftime('%d %b')}] {title}: {message}"
            profile.save(update_fields=['individual_note'])

        return JsonResponse({
            'success': True,
            'message': f"Notification logged for student {student_query}."
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@require_voice_api_key
def voice_get_teacher(request):
    """
    GET /api/v1/voice/teacher/?username=teacher1
    Returns teacher profile and assigned sections/subjects.
    """
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    query = request.GET.get('username', '').strip() or request.GET.get('name', '').strip()
    teacher = User.objects.filter(
        Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query),
        role='teacher'
    ).first()

    if not teacher:
        return JsonResponse({'success': False, 'error': f"Teacher '{query}' not found"}, status=404)

    assigned_sections = list(teacher.assigned_batches.values_list('name', flat=True))
    teaching_subjects = list(teacher.teaching_subjects.values_list('name', flat=True))

    return JsonResponse({
        'success': True,
        'teacher_name': teacher.get_full_name(),
        'username': teacher.username,
        'email': teacher.email,
        'assigned_sections': assigned_sections,
        'teaching_subjects': teaching_subjects
    })


@csrf_exempt
@require_voice_api_key
def voice_academic_summary(request):
    """
    GET /api/v1/voice/academic-summary/?query=Rahul
    Returns complete academic summary including average percentage, total tests, attendance count, and fee status.
    """
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    query = request.GET.get('query', '').strip() or request.GET.get('name', '').strip()
    profile = StudentProfile.objects.filter(
        Q(user__first_name__icontains=query) |
        Q(user__last_name__icontains=query) |
        Q(user__username__icontains=query)
    ).select_related('user', 'batch').first()

    if not profile:
        return JsonResponse({'success': False, 'error': f"Student '{query}' not found"}, status=404)

    total_att = AttendanceRecord.objects.filter(student=profile).count()
    present_att = AttendanceRecord.objects.filter(student=profile, status='present').count()
    att_rate = round((present_att / total_att * 100.0), 1) if total_att > 0 else 100.0

    corrections = AssignmentCorrection.objects.filter(student=profile)
    total_tests = corrections.count()
    
    pct_list = []
    for c in corrections:
        if c.marks_obtained is not None and c.max_marks > 0:
            pct_list.append((float(c.marks_obtained) / float(c.max_marks)) * 100.0)
    avg_score = round(sum(pct_list) / len(pct_list), 1) if pct_list else 0.0

    return JsonResponse({
        'success': True,
        'student_name': profile.user.get_full_name(),
        'section': profile.batch.name if profile.batch else 'Unassigned',
        'attendance_percentage': att_rate,
        'total_assessments': total_tests,
        'average_score_percentage': avg_score,
        'remaining_fee': float(profile.remaining_balance),
        'fee_status': profile.fee_status
    })


@csrf_exempt
def schoolai_chat_api(request):
    """
    Public/Authenticated REST API Endpoint for SchoolAiVoice Assistant.
    Accessible from login page & base template widget.
    Enforces natural conversation, creator attribution ("I was created by Keerthana of 8th std, Flora Carmeli Convent Mysore."),
    and identity verification before returning sensitive records.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        user_message = data.get('message', '').strip()
        session_ctx = data.get('session_context', {})

        if request.user.is_authenticated and request.user.role == 'teacher':
            session_ctx['is_logged_in_teacher'] = True
            session_ctx['teacher_username'] = request.user.username

        from SchoolAiVoice.ai_engine import ai_engine
        result = ai_engine.process_message(user_message, session_ctx)

        # If action requires fetching student data after verification
        if result.get('action') == 'fetch_student_data':
            student_query = result.get('student_name', '')
            profile = StudentProfile.objects.filter(
                Q(user__first_name__icontains=student_query) |
                Q(user__last_name__icontains=student_query) |
                Q(user__username__icontains=student_query)
            ).select_related('user', 'batch').first()

            if profile:
                total_att = AttendanceRecord.objects.filter(student=profile).count()
                present_att = AttendanceRecord.objects.filter(student=profile, status='present').count()
                att_rate = (present_att / total_att * 100.0) if total_att > 0 else 100.0

                corrections = AssignmentCorrection.objects.filter(student=profile).select_related('subject')[:5]
                marks_list = [
                    {'subject': c.subject.name if c.subject else 'General', 'marks_obtained': float(c.marks_obtained or 0), 'max_marks': float(c.max_marks or 100)}
                    for c in corrections
                ]

                reply_text = ai_engine.format_empathetic_performance_summary(
                    student_name=profile.user.get_full_name(),
                    marks_list=marks_list,
                    attendance_pct=att_rate,
                    fee_status=profile.fee_status,
                    remaining_fee=float(profile.remaining_balance)
                )
                result['reply'] = reply_text
            else:
                result['reply'] = f"I checked the records, but I couldn't find a student matching '{student_query}'. Please double check the spelling."

        return JsonResponse({
            'success': True,
            'reply': result.get('reply'),
            'intent': result.get('intent'),
            'session_context': session_ctx
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'reply': "I couldn't process that right now. Please try asking again in a moment.",
            'error': str(e)
        }, status=400)

