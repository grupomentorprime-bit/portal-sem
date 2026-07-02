import type { PersonItem, TeacherItem } from "@/types/content";
import type { PortalPersonCardData } from "@/types/people-grid";

export function personItemToPortalPersonCard(person: PersonItem): PortalPersonCardData {
  return {
    id: person.id,
    name: person.name,
    position: person.position,
    specialty: person.specialty,
    bio: person.bio,
    image: person.image,
    email: person.email,
    phone: person.phone,
    linkedin: person.linkedin,
    facebook: person.facebook,
    instagram: person.instagram,
    href: person.href,
    personRole: person.personRole,
    featured: person.featured,
    personStatus: person.personStatus,
    order: person.order,
    visible: person.visible,
  };
}

export function personItemsToPortalPersonCards(people: PersonItem[]): PortalPersonCardData[] {
  return people.map(personItemToPortalPersonCard);
}

export function teacherItemToPersonItem(teacher: TeacherItem): PersonItem {
  return {
    id: teacher.id,
    name: teacher.name,
    position: teacher.role,
    specialty: teacher.specialty,
    image: teacher.image,
    personRole: "teacher",
    visible: true,
  };
}

export function teacherItemsToPortalPersonCards(teachers: TeacherItem[]): PortalPersonCardData[] {
  return teachers.map((teacher) => personItemToPortalPersonCard(teacherItemToPersonItem(teacher)));
}
