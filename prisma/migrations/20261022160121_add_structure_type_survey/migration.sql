-- CreateEnum
CREATE TYPE "SurveyStructureType" AS ENUM ('AcademieRectorat', 'Association', 'Aci', 'CaisseDesEcoles', 'Ccas', 'Cdas', 'CentreDeGestion', 'CentreSocial', 'Cias', 'Commune', 'Crous', 'Departement', 'Epci', 'Ept', 'GroupementInteretPublic', 'Hopital', 'Ministere', 'Musee', 'Prefecture', 'RegieAutonome', 'Sdis', 'Universite', 'Autre');

-- CreateEnum
CREATE TYPE "SurveySocialSupportType" AS ENUM ('InsertionEmploi', 'ProgrammeReussiteEducative', 'LogementHebergementResidence', 'ServiceSocialPersonnel', 'SuiviEtudiant', 'SuiviSocialGeneraliste');

-- DropIndex
DROP INDEX "beneficiary_structure_id_birth_name_normalized_idx";

-- DropIndex
DROP INDEX "beneficiary_structure_id_first_name_normalized_idx";

-- DropIndex
DROP INDEX "beneficiary_structure_id_usual_name_normalized_idx";

-- DropIndex
DROP INDEX "followup_type_id_include_name_idx";

-- CreateTable
CREATE TABLE "structure_type_survey" (
    "id" UUID NOT NULL,
    "structure_id" UUID NOT NULL,
    "structure_type" "SurveyStructureType" NOT NULL,
    "structure_type_other" TEXT,
    "social_support_types" "SurveySocialSupportType"[],
    "filled_by_id" UUID,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "structure_type_survey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "structure_type_survey_structure_id_key" ON "structure_type_survey"("structure_id");

-- AddForeignKey
ALTER TABLE "structure_type_survey" ADD CONSTRAINT "structure_type_survey_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_type_survey" ADD CONSTRAINT "structure_type_survey_filled_by_id_fkey" FOREIGN KEY ("filled_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
