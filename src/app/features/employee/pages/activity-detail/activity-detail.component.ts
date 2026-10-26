import { Component, OnInit, OnDestroy, ChangeDetectorRef, Optional } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivityService } from '../../../../core/services/activity.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import {
  Activity,
  NGO,
  ActivitySlotSummary,
  ActivityAvailabilityStatus,
  ServiceType,
  User,
  Registration
} from '../../../../models';

export interface VolunteerExpectation {
  tasks: string[];
  equipmentProvided: string[];
  volunteerRequirements: string[];
}

@Component({
  selector: 'app-activity-detail',
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.css'],
  standalone: false
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  activityId: string = '';
  activity: Activity | null = null;
  ngo: NGO | null = null;
  slotSummary: ActivitySlotSummary | null = null;
  isLoading: boolean = true;
  notFound: boolean = false;

  // Logged in user & enrollment state
  currentUser: User | null = null;
  isUserRegistered: boolean = false;
  userRegistration: Registration | null = null;

  // Active Registration Modal State
  showRegistrationModal: boolean = false;
  overlappingActivities: Activity[] = [];
  isSubmittingRegistration: boolean = false;
  registrationModalError: string | null = null;

  // Toast / Feedback banner
  feedbackBanner: { type: 'success' | 'error'; message: string } | null = null;

  // Legacy/Contract notice compatibility
  showContractNotice: boolean = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly activityService: ActivityService,
    private readonly dataStore: DataStoreService,
    private readonly cdr: ChangeDetectorRef,
    @Optional() private readonly authService?: AuthService,
    @Optional() private readonly registrationService?: RegistrationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.activityId = params.get('id') || '';
      if (!this.activityId) {
        this.notFound = true;
        this.isLoading = false;
        return;
      }
      this.loadActivityDetails();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadActivityDetails(): void {
    this.isLoading = true;
    const user$ = this.authService ? this.authService.currentUser$ : of(null);

    combineLatest([
      this.activityService.getActivityById(this.activityId),
      this.dataStore.ngos$,
      this.dataStore.registrations$,
      user$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([act, ngos, registrations, user]) => {
        this.isLoading = false;
        this.currentUser = user;

        if (!act) {
          this.notFound = true;
          this.activity = null;
          this.cdr.markForCheck();
          return;
        }

        this.activity = act;
        this.notFound = false;
        this.ngo = ngos.find((n) => n.id === act.ngoId) || null;
        this.slotSummary = this.activityService.computeSlotSummary(act, registrations);

        if (user) {
          const reg = registrations.find(
            (r) => r.employeeId === user.id && r.activityId === act.id && r.status === 'ACTIVE'
          );
          this.isUserRegistered = !!reg;
          this.userRegistration = reg || null;
        } else {
          this.isUserRegistered = false;
          this.userRegistration = null;
        }

        this.cdr.markForCheck();
      });
  }

  get expectations(): VolunteerExpectation {
    if (!this.activity) {
      return { tasks: [], equipmentProvided: [], volunteerRequirements: [] };
    }
    return this.getExpectationsByType(this.activity.serviceType);
  }

  private getExpectationsByType(type: ServiceType): VolunteerExpectation {
    switch (type) {
      case 'ENVIRONMENT':
        return {
          tasks: [
            'Seedling sorting, staging, and soil root-ball preparation',
            'Planting and securing saplings along designated restoration transects',
            'Marine debris collection, categorization, and digital tally recording',
            'Post-activity site cleanup and equipment return'
          ],
          equipmentProvided: [
            'Protective heavy-duty rubber boots and gardening gloves',
            'Planting spades and measuring markers',
            'Hydration water refilling station'
          ],
          volunteerRequirements: [
            'Wear comfortable outdoor attire suitable for damp mud terrain',
            'Bring reusable personal water bottle and sun protection (hat/sunscreen)',
            'Minimum physical stamina for 3 hours of outdoor activity'
          ]
        };
      case 'EDUCATION':
        return {
          tasks: [
            'Facilitate interactive learning modules and hands-on robotics kits',
            'Guide student teams through problem-solving exercises',
            'Assist NGO educators with classroom queue and material distribution',
            'Provide motivational encouragement and group feedback'
          ],
          equipmentProvided: [
            'Instructional workshop guides and student workbook packets',
            'Robotics hardware kits and teacher tablets',
            'Staff badge and educational facilitator lanyards'
          ],
          volunteerRequirements: [
            'Professional business-casual attire appropriate for learning spaces',
            'Enthusiasm for patient, positive interaction with young learners',
            'Arrive 15 minutes before the opening bell for team briefing'
          ]
        };
      case 'FOOD_SECURITY':
        return {
          tasks: [
            'Inspect and grade donated fresh produce from wholesale distributors',
            'Assemble balanced staple rations into family supply boxes',
            'Seal, weigh, and label humanitarian food packages',
            'Load delivery staging pallets for logistics departure'
          ],
          equipmentProvided: [
            'Food-safe hairnets, aprons, and nitrile gloves',
            'Tape dispensers, box cutters, and pallet hand-trucks',
            'Sanitation wipes and hydration station'
          ],
          volunteerRequirements: [
            'Closed-toe sturdy shoes required (no sandals or canvas flats)',
            'Tie long hair back; minimal jewelry in packaging zones',
            'Ability to lift boxes weighing up to 10 kg periodically'
          ]
        };
      case 'COMMUNITY':
        return {
          tasks: [
            'Assist civil engineers with secondary pipe trenching and line assembly',
            'Construct community garden planter boxes and secure soil liners',
            'Paint community markers and post informational care guides',
            'Engage with neighborhood resident leaders during handover'
          ],
          equipmentProvided: [
            'Hard hats, high-visibility vests, and work gloves',
            'Hand tools, carpentry rulers, and level gauges',
            'First aid station and shaded rest pavilion'
          ],
          volunteerRequirements: [
            'Workwear or durable jeans and work boots/sneakers',
            'Willingness to follow safety supervisor instructions closely',
            'Hydration reminder: Bring a refillable thermos'
          ]
        };
      case 'HEALTH':
        return {
          tasks: [
            'Assist clinic staff with patient registration intake forms',
            'Direct elderly attendees to biometric screening and consultation stations',
            'Distribute informational wellness guides and medication instructions',
            'Provide wheelchair or mobility escort support for seniors'
          ],
          equipmentProvided: [
            'Medical-grade disposable masks and sanitizing supplies',
            'Volunteer identification badges and clipboards',
            'Clinic escort mobility aids'
          ],
          volunteerRequirements: [
            'Neat professional attire and comfortable walking shoes',
            'Compassionate communication style with elderly patients',
            'Adherence to patient privacy and confidentiality policies'
          ]
        };
      default:
        return {
          tasks: ['Active participation in community service workflow'],
          equipmentProvided: ['Standard volunteer kit'],
          volunteerRequirements: ['Comfortable clothing and punctual arrival']
        };
    }
  }

  get volunteeringHours(): number {
    if (!this.activity) return 0;
    const start = new Date(this.activity.startDateTime).getTime();
    const end = new Date(this.activity.endDateTime).getTime();
    const diffHours = (end - start) / (1000 * 60 * 60);
    return Math.max(1, Math.round(diffHours * 10) / 10);
  }

  isActionable(status?: ActivityAvailabilityStatus): boolean {
    return status === 'AVAILABLE' || status === 'ALMOST_FULL';
  }

  openRegistrationModal(): void {
    this.feedbackBanner = null;
    this.registrationModalError = null;

    if (!this.currentUser) {
      this.feedbackBanner = {
        type: 'error',
        message: 'Please sign in to register for activities.'
      };
      return;
    }

    if (this.isUserRegistered) {
      this.feedbackBanner = {
        type: 'error',
        message: 'You already have an active registration for this initiative.'
      };
      return;
    }

    if (!this.activity) return;

    if (this.registrationService) {
      const check = this.registrationService.canRegister(this.currentUser.id, this.activity.id);
      if (!check.allowed) {
        this.feedbackBanner = {
          type: 'error',
          message: check.reason || 'This activity cannot accept registrations.'
        };
        return;
      }
      this.overlappingActivities = check.overlappingActivities || [];
    } else {
      this.overlappingActivities = [];
    }

    this.showRegistrationModal = true;
    this.cdr.markForCheck();
  }

  confirmRegistration(): void {
    if (!this.activity || !this.currentUser) return;

    if (!this.registrationService) {
      this.closeRegistrationModal();
      return;
    }

    this.isSubmittingRegistration = true;
    this.registrationModalError = null;

    try {
      this.registrationService.register(this.currentUser.id, this.activity.id).subscribe({
        next: (reg) => {
          this.feedbackBanner = {
            type: 'success',
            message: `Successfully registered for "${this.activity?.title}"! 1 spot reserved.`
          };
          this.isSubmittingRegistration = false;
          this.showRegistrationModal = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmittingRegistration = false;
          this.registrationModalError = err?.message || 'Registration failed.';
          this.cdr.markForCheck();
        }
      });
    } catch (err: any) {
      this.isSubmittingRegistration = false;
      this.registrationModalError = err?.message || 'Registration failed.';
      this.cdr.markForCheck();
    }
  }

  closeRegistrationModal(): void {
    this.showRegistrationModal = false;
    this.overlappingActivities = [];
    this.registrationModalError = null;
    this.cdr.markForCheck();
  }

  triggerRegistrationContract(): void {
    this.showContractNotice = true;
    this.openRegistrationModal();
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (_) {}
    }
    this.cdr.markForCheck();
  }

  dismissContractNotice(): void {
    this.showContractNotice = false;
  }

  dismissFeedbackBanner(): void {
    this.feedbackBanner = null;
  }

  getCategoryLabel(type?: ServiceType): string {
    if (!type) return '';
    switch (type) {
      case 'ENVIRONMENT':
        return 'Environment & Nature';
      case 'EDUCATION':
        return 'Education & Youth';
      case 'FOOD_SECURITY':
        return 'Food Security';
      case 'COMMUNITY':
        return 'Community Support';
      case 'HEALTH':
        return 'Public Health';
      default:
        return type;
    }
  }
}
